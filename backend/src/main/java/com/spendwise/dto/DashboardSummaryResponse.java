package com.spendwise.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        String currency,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netCashFlow,
        BigDecimal savingsRate,
        String periodStart,
        String periodEnd
) {
}
