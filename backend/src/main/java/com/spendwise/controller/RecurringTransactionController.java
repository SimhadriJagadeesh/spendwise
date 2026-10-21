package com.spendwise.controller;

import com.spendwise.dto.RecurringTransactionRequest;
import com.spendwise.dto.RecurringTransactionResponse;
import com.spendwise.service.RecurringTransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/recurring")
public class RecurringTransactionController {
    private final RecurringTransactionService recurringService;

    public RecurringTransactionController(RecurringTransactionService recurringService) {
        this.recurringService = recurringService;
    }

    @GetMapping
    public List<RecurringTransactionResponse> list(@AuthenticationPrincipal String username) {
        return recurringService.list(username);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringTransactionResponse> get(@AuthenticationPrincipal String username,
                                                           @PathVariable Long id) {
        return ResponseEntity.ok(recurringService.getOne(username, id));
    }

    @GetMapping("/due")
    public List<RecurringTransactionResponse> due(
            @AuthenticationPrincipal String username,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.now();
        LocalDate end = to != null ? to : LocalDate.now().plusMonths(1);
        return recurringService.dueBetween(username, start, end);
    }

    @PostMapping
    public ResponseEntity<RecurringTransactionResponse> create(
            @AuthenticationPrincipal String username,
            @Valid @RequestBody RecurringTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recurringService.create(username, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringTransactionResponse> update(
            @AuthenticationPrincipal String username,
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionRequest request) {
        return ResponseEntity.ok(recurringService.update(username, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal String username, @PathVariable Long id) {
        recurringService.delete(username, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/advance")
    public ResponseEntity<RecurringTransactionResponse> advance(@AuthenticationPrincipal String username,
                                                                @PathVariable Long id) {
        return ResponseEntity.ok(recurringService.advance(username, id));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<RecurringTransactionResponse> setActive(
            @AuthenticationPrincipal String username,
            @PathVariable Long id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(recurringService.setActive(username, id, active));
    }
}
