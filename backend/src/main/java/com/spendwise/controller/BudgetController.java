package com.spendwise.controller;

import com.spendwise.dto.BudgetRequest;
import com.spendwise.dto.BudgetResponse;
import com.spendwise.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {
    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetResponse> list(@AuthenticationPrincipal String username) {
        return budgetService.list(username);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetResponse> get(@AuthenticationPrincipal String username, @PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getOne(username, id));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@AuthenticationPrincipal String username,
                                                 @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(budgetService.create(username, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(@AuthenticationPrincipal String username,
                                                 @PathVariable Long id,
                                                 @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.update(username, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal String username, @PathVariable Long id) {
        budgetService.delete(username, id);
        return ResponseEntity.noContent().build();
    }
}
