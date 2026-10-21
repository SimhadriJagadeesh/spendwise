package com.spendwise.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * The CSV escaping rules are the last line of defence against spreadsheet
 * formula injection, so they are pinned down here. No database is involved.
 */
class ExportControllerTest {

    @Test
    void plainValueIsUnchanged() {
        assertEquals("Groceries", ExportController.escape("Groceries"));
    }

    @Test
    void nullBecomesAnEmptyCell() {
        assertEquals("", ExportController.escape(null));
    }

    @Test
    void valuesWithSeparatorsAreQuoted() {
        assertEquals("\"Rent, utilities\"", ExportController.escape("Rent, utilities"));
        assertEquals("\"Line one\nLine two\"", ExportController.escape("Line one\nLine two"));
    }

    @Test
    void embeddedQuotesAreDoubled() {
        assertEquals("\"say \"\"hi\"\"\"", ExportController.escape("say \"hi\""));
    }

    @Test
    void leadingFormulaCharactersAreNeutralised() {
        assertEquals("'=SUM(A1:A9)", ExportController.escape("=SUM(A1:A9)"));
        assertEquals("'+1", ExportController.escape("+1"));
        assertEquals("'-2", ExportController.escape("-2"));
        assertEquals("'@cmd", ExportController.escape("@cmd"));
    }

    @Test
    void aQuotedCellThatStartsWithAFormulaCharacterIsStillNeutralised() {
        // Quoting alone does not stop Excel from evaluating the cell: the formula
        // guard has to run before the value is wrapped in quotes.
        assertEquals("\"'=SUM(A1,A9)\"", ExportController.escape("=SUM(A1,A9)"));
        assertEquals("\"'-1,2\"", ExportController.escape("-1,2"));
    }

    @Test
    void formulaCharactersInsideAValueAreNotTreatedAsFormulas() {
        // Only a leading character is dangerous, so a value like "a=b" stays readable.
        assertEquals("a=b", ExportController.escape("a=b"));
    }
}
