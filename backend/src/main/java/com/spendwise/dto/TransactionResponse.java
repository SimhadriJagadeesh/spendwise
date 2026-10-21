package com.spendwise.dto;

import com.spendwise.entity.Category;
import com.spendwise.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        String type,
        String description,
        String merchant,
        BigDecimal amount,
        String currency,
        LocalDate transactionDate,
        CategorySummary category,
        String notes,
        String tags,
        boolean reviewed
) {
    public record CategorySummary(Long id, String name, String color) {
        public static CategorySummary of(Category category) {
            if (category == null) return null;
            return new CategorySummary(category.getId(), category.getName(), category.getColor());
        }
    }

    public static TransactionResponse of(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                t.getType(),
                t.getDescription(),
                t.getMerchant(),
                t.getAmount(),
                t.getCurrency(),
                t.getTransactionDate(),
                CategorySummary.of(t.getCategory()),
                t.getNotes(),
                t.getTags(),
                t.isReviewed());
    }
}
