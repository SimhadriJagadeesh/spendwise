package com.spendwise.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotBlank(message = "Type is required")
        @Pattern(regexp = "INCOME|EXPENSE|TRANSFER", message = "Type must be INCOME, EXPENSE or TRANSFER")
        String type,

        @Size(max = 255, message = "Description is too long")
        String description,

        @Size(max = 255, message = "Merchant is too long")
        String merchant,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0001", message = "Amount must be greater than zero")
        @Digits(integer = 15, fraction = 4, message = "Amount has too many decimal places")
        BigDecimal amount,

        @NotBlank(message = "Currency is required")
        @Pattern(regexp = "[A-Z]{3}", message = "Currency must be a 3-letter ISO 4217 code")
        String currency,

        @NotNull(message = "Date is required")
        LocalDate transactionDate,

        Long categoryId,

        @Size(max = 2000, message = "Notes are too long")
        String notes,

        @Size(max = 255, message = "Tags are too long")
        String tags
) {
}
