package com.spendwise.controller;

import com.spendwise.dto.GoalContributionRequest;
import com.spendwise.dto.GoalContributionResponse;
import com.spendwise.dto.SavingsGoalRequest;
import com.spendwise.dto.SavingsGoalResponse;
import com.spendwise.service.SavingsGoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
public class SavingsGoalController {
    private final SavingsGoalService savingsGoalService;

    public SavingsGoalController(SavingsGoalService savingsGoalService) {
        this.savingsGoalService = savingsGoalService;
    }

    @GetMapping
    public List<SavingsGoalResponse> list(@AuthenticationPrincipal String username) {
        return savingsGoalService.list(username);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> get(@AuthenticationPrincipal String username,
                                                    @PathVariable Long id) {
        return ResponseEntity.ok(savingsGoalService.getOne(username, id));
    }

    @PostMapping
    public ResponseEntity<SavingsGoalResponse> create(@AuthenticationPrincipal String username,
                                                      @Valid @RequestBody SavingsGoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savingsGoalService.create(username, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> update(@AuthenticationPrincipal String username,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody SavingsGoalRequest request) {
        return ResponseEntity.ok(savingsGoalService.update(username, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal String username, @PathVariable Long id) {
        savingsGoalService.delete(username, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/contributions")
    public List<GoalContributionResponse> contributions(@AuthenticationPrincipal String username,
                                                        @PathVariable Long id) {
        return savingsGoalService.contributions(username, id);
    }

    @PostMapping("/{id}/contributions")
    public ResponseEntity<SavingsGoalResponse> addContribution(@AuthenticationPrincipal String username,
                                                               @PathVariable Long id,
                                                               @Valid @RequestBody GoalContributionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savingsGoalService.addContribution(username, id, request));
    }
}
