package com.spendwise.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name is too long")
        String name,

        @NotBlank(message = "Type is required")
        @Pattern(regexp = "INCOME|EXPENSE", message = "Type must be INCOME or EXPENSE")
        String type,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0001", message = "Amount must be greater than zero")
        @Digits(integer = 15, fraction = 4, message = "Amount has too many decimal places")
        BigDecimal amount,

        @NotBlank(message = "Currency is required")
        @Pattern(regexp = "[A-Z]{3}", message = "Currency must be a 3-letter ISO 4217 code")
        String currency,

        @NotBlank(message = "Frequency is required")
        @Pattern(regexp = "WEEKLY|MONTHLY|YEARLY", message = "Frequency must be WEEKLY, MONTHLY or YEARLY")
        String frequency,

        @Min(value = 1, message = "Interval must be at least 1")
        @Max(value = 52, message = "Interval must be at most 52")
        Integer intervalCount,

        @NotNull(message = "Next payment date is required")
        LocalDate nextPaymentDate,

        Long categoryId
) {
}
