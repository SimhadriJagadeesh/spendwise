package com.spendwise.service;

import com.spendwise.repository.AnalyticsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {
    private final AnalyticsRepository analyticsRepository;

    public AnalyticsService(AnalyticsRepository analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }

    /** Monthly income and expense totals, one row per month that has records. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> cashFlow(String username, String currency, LocalDate from, LocalDate to) {
        LocalDate start = (from != null) ? from : LocalDate.now().withDayOfYear(1);
        LocalDate end = (to != null) ? to : LocalDate.now();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object[] row : analyticsRepository.cashFlowByMonth(username, currency, start, end)) {
            Map<String, Object> item = new LinkedHashMap<>();
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            item.put("month", String.format("%04d-%02d", year, month));
            item.put("income", toBigDecimal(row[2]));
            item.put("expenses", toBigDecimal(row[3]));
            rows.add(item);
        }
        return rows;
    }

    /** Expense totals grouped by category, largest first. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> spendingByCategory(String username, String currency, LocalDate from, LocalDate to) {
        LocalDate start = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (to != null) ? to : LocalDate.now();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object[] row : analyticsRepository.spendingByCategory(username, currency, start, end)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("category", String.valueOf(row[0]));
            item.put("total", toBigDecimal(row[1]));
            rows.add(item);
        }
        return rows;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return BigDecimal.ZERO;
    }
}
