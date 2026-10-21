package com.spendwise.service;

import com.spendwise.entity.RecurrenceFrequency;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Calculates the next expected payment date for a recurring schedule.
 * Dates are handled in plain local dates (no time zone conversion) because
 * a bill is a calendar day, not an instant.
 */
@Component
public class RecurringDateCalculator {

    public LocalDate nextDate(LocalDate current, RecurrenceFrequency frequency, int interval) {
        int step = Math.max(interval, 1);
        return switch (frequency) {
            case WEEKLY -> current.plusWeeks(step);
            case MONTHLY -> current.plusMonths(step);
            case YEARLY -> current.plusYears(step);
        };
    }
}
