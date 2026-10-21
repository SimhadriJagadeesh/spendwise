package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionResponse(
        Long id,
        String name,
        String type,
        BigDecimal amount,
        String currency,
        String frequency,
        Integer intervalCount,
        LocalDate nextPaymentDate,
        boolean active,
        Long categoryId,
        String categoryName
) {
}
