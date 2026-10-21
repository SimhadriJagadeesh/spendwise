package com.spendwise.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalContributionRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0001", message = "Amount must be greater than zero")
        @Digits(integer = 15, fraction = 4, message = "Amount has too many decimal places")
        BigDecimal amount,

        @NotNull(message = "Date is required")
        LocalDate contributionDate,

        @Size(max = 255, message = "Notes are too long")
        String notes
) {
}
