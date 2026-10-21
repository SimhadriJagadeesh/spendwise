package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalContributionResponse(
        Long id,
        Long goalId,
        BigDecimal amount,
        LocalDate contributionDate,
        String notes
) {
}
