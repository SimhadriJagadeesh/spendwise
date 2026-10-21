package com.spendwise.controller;

import com.spendwise.dto.TransactionResponse;
import com.spendwise.exception.ApiException;
import com.spendwise.service.TransactionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exports")
public class ExportController {
    private final TransactionService transactionService;

    public ExportController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/transactions.csv")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> export(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String currency,
            Authentication authentication) {
        // Identity comes from the verified security context, never from a client-supplied user id.
        String username = authentication.getName();

        String currencyFilter = (currency == null || currency.isBlank())
                ? null
                : currency.trim().toUpperCase();
        if (currencyFilter != null && !currencyFilter.matches("[A-Z]{3}")) {
            throw ApiException.badRequest("Currency must be a 3-letter ISO 4217 code");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw ApiException.badRequest("'from' must not be after 'to'");
        }

        List<TransactionResponse> rows = transactionService.exportRows(username, currencyFilter, from, to);

        StringBuilder csv = new StringBuilder();
        csv.append("date,description,merchant,category,type,amount,currency,notes\n");
        for (TransactionResponse t : rows) {
            csv.append(escape(t.transactionDate() != null ? t.transactionDate().toString() : ""))
               .append(",").append(escape(t.description()))
               .append(",").append(escape(t.merchant()))
               .append(",").append(escape(t.category() != null ? t.category().name() : ""))
               .append(",").append(escape(t.type()))
               .append(",").append(t.amount() != null ? t.amount().toPlainString() : "0")
               .append(",").append(escape(t.currency()))
               .append(",").append(escape(t.notes()))
               .append("\n");
        }

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=utf-8")
                .header("Content-Disposition",
                        "attachment; filename=spendwise_transactions_" + (currencyFilter != null ? currencyFilter : "all") + ".csv")
                .body(csv.toString());
    }

    /**
     * Escapes a CSV cell. Package-private so the escaping rules can be unit tested
     * without starting a web server or touching a database.
     */
    static String escape(String value) {
        if (value == null) {
            return "";
        }
        // Mitigate spreadsheet formula injection (a leading =, +, -, @ is interpreted
        // as a formula). This must happen BEFORE quoting: quoting only escapes the
        // cell for the CSV parser, so Excel would still evaluate "=SUM(A1,A9)" as a
        // formula. A leading apostrophe inside the cell makes it text.
        String v = value;
        if (v.startsWith("=") || v.startsWith("+") || v.startsWith("-") || v.startsWith("@")) {
            v = "'" + v;
        }
        v = v.replace("\"", "\"\"");
        if (v.contains(",") || v.contains("\n") || v.contains("\r") || v.contains("\"")) {
            v = "\"" + v + "\"";
        }
        return v;
    }
}
