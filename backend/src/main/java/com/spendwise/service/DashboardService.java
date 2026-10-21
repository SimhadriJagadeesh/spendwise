package com.spendwise.service;

import com.spendwise.dto.DashboardSummaryResponse;
import com.spendwise.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class DashboardService {
    private final TransactionRepository transactionRepo;

    public DashboardService(TransactionRepository transactionRepo) {
        this.transactionRepo = transactionRepo;
    }

    /**
     * Totals are computed per currency. Amounts in different currencies are never added
     * together, so a single-currency summary reports only the requested currency.
     */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(String username, String currency, LocalDate from, LocalDate to) {
        LocalDate start = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (to != null) ? to : LocalDate.now();

        BigDecimal income = nullToZero(
                transactionRepo.sumByType(username, "INCOME", currency, start, end));
        BigDecimal expenses = nullToZero(
                transactionRepo.sumByType(username, "EXPENSE", currency, start, end));

        BigDecimal net = income.subtract(expenses);
        BigDecimal savingsRate = income.signum() == 0
                ? BigDecimal.ZERO
                : net.multiply(BigDecimal.valueOf(100))
                        .divide(income, 2, RoundingMode.HALF_UP);

        return new DashboardSummaryResponse(
                currency,
                income,
                expenses,
                net,
                savingsRate,
                start.toString(),
                end.toString());
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
