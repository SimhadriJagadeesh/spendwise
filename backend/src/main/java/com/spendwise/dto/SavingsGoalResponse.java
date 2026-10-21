package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalResponse(
        Long id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal remaining,
        BigDecimal percentComplete,
        String currency,
        LocalDate deadline,
        boolean completed
) {
}
