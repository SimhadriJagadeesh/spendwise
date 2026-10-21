package com.spendwise.dto;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String period,
        String month,
        BigDecimal amount,
        String currency,
        BigDecimal spent,
        BigDecimal remaining,
        BigDecimal percentUsed,
        String status
) {
    public enum Status { ON_TRACK, WARNING, OVER_BUDGET }
}
