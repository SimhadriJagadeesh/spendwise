package com.spendwise.controller;

import com.spendwise.dto.TransactionRequest;
import com.spendwise.dto.TransactionResponse;
import com.spendwise.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {
    private static final int MAX_PAGE_SIZE = 100;

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public Page<TransactionResponse> list(
            @AuthenticationPrincipal String username,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "transactionDate") String sort) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        Sort sortBy = safeSort(sort);

        Page<TransactionResponse> result = transactionService
                .search(username, type, currency, from, to, search, PageRequest.of(safePage, safeSize, sortBy));
        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> get(@AuthenticationPrincipal String username,
                                                    @PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getOne(username, id));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@AuthenticationPrincipal String username,
                                                      @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.create(username, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(@AuthenticationPrincipal String username,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.update(username, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal String username, @PathVariable Long id) {
        transactionService.delete(username, id);
        return ResponseEntity.noContent().build();
    }

    /** Only allow sorting on known fields to avoid invalid column names reaching the query. */
    private Sort safeSort(String sort) {
        String field = (sort == null || sort.isBlank()) ? "transactionDate" : sort.trim();
        boolean descending = field.startsWith("-");
        if (descending) {
            field = field.substring(1);
        }
        if (!field.equals("transactionDate") && !field.equals("amount") && !field.equals("createdAt")) {
            field = "transactionDate";
        }
        return Sort.by(descending ? Sort.Direction.DESC : Sort.Direction.ASC, field);
    }
}
