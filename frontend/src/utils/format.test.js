import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, parseDate, todayISO, currentMonthISO } from './format.js';

/**
 * A transaction date is a calendar day, not an instant. These tests pin the
 * behaviour that a bare "YYYY-MM-DD" is read in the reader's own time zone -
 * `new Date('2026-03-01')` would be UTC midnight, which is the previous day in
 * any negative UTC offset.
 */
test('parseDate reads a YYYY-MM-DD string as a local calendar day', () => {
  const date = parseDate('2026-03-01');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 2);
  assert.equal(date.getDate(), 1);
});

test('parseDate returns null for an empty or unparseable value', () => {
  assert.equal(parseDate(null), null);
  assert.equal(parseDate(''), null);
  assert.equal(parseDate('not-a-date'), null);
});

test('formatDate does not shift the day backwards', () => {
  assert.equal(formatDate('2026-03-01'), 'Mar 01, 2026');
  assert.equal(formatDate('2026-12-31'), 'Dec 31, 2026');
});

test('formatDate renders a placeholder for a missing date', () => {
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate(''), '—');
});

test('todayISO produces a zero-padded local date', () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test('currentMonthISO produces a zero-padded local month', () => {
  assert.match(currentMonthISO(), /^\d{4}-\d{2}$/);
  assert.equal(currentMonthISO(), todayISO().slice(0, 7));
});
