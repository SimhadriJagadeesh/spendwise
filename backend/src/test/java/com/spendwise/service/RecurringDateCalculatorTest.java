package com.spendwise.service;

import com.spendwise.entity.RecurrenceFrequency;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecurringDateCalculatorTest {

    private final RecurringDateCalculator calculator = new RecurringDateCalculator();

    @Test
    void weeklyAdvancesByTheGivenNumberOfWeeks() {
        LocalDate start = LocalDate.of(2026, 3, 2);

        assertEquals(LocalDate.of(2026, 3, 9), calculator.nextDate(start, RecurrenceFrequency.WEEKLY, 1));
        assertEquals(LocalDate.of(2026, 3, 30), calculator.nextDate(start, RecurrenceFrequency.WEEKLY, 4));
    }

    @Test
    void monthlyKeepsTheDayOfMonthWhenItExists() {
        LocalDate start = LocalDate.of(2026, 1, 15);

        assertEquals(LocalDate.of(2026, 2, 15), calculator.nextDate(start, RecurrenceFrequency.MONTHLY, 1));
        assertEquals(LocalDate.of(2026, 4, 15), calculator.nextDate(start, RecurrenceFrequency.MONTHLY, 3));
    }

    @Test
    void monthlyClampsToTheLastDayOfAShorterMonth() {
        LocalDate start = LocalDate.of(2026, 1, 31);

        // February 2026 has 28 days, so the 31st must not overflow into March.
        assertEquals(LocalDate.of(2026, 2, 28), calculator.nextDate(start, RecurrenceFrequency.MONTHLY, 1));
    }

    @Test
    void yearlyAdvancesTheYearAndKeepsTheMonthAndDay() {
        LocalDate start = LocalDate.of(2026, 6, 30);

        assertEquals(LocalDate.of(2027, 6, 30), calculator.nextDate(start, RecurrenceFrequency.YEARLY, 1));
        assertEquals(LocalDate.of(2031, 6, 30), calculator.nextDate(start, RecurrenceFrequency.YEARLY, 5));
    }

    @Test
    void intervalBelowOneIsTreatedAsOne() {
        LocalDate start = LocalDate.of(2026, 3, 2);

        assertEquals(LocalDate.of(2026, 3, 9), calculator.nextDate(start, RecurrenceFrequency.WEEKLY, 0));
        assertEquals(LocalDate.of(2026, 3, 9), calculator.nextDate(start, RecurrenceFrequency.WEEKLY, -3));
    }
}
