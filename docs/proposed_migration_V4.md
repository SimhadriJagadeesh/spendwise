-- PROPOSED ONLY - NOT EXECUTED. Requires explicit user approval before running.
--
-- Purpose: reconcile the source schema with the existing `spendwise` database.
--
-- Context discovered during audit:
--   * The database has 12 tables: accounts, budgets, categories, flyway_schema_history,
--     goal_contributions, investments, lending_records, recurring_transactions, repayments,
--     savings_goals, transactions, users.
--   * flyway_schema_history records V1 "init users", V2 "core finance", V3 "budgets goals invest lending".
--   * The repository's migration files are named V1__schema.sql, V2__categories.sql,
--     V3__transactions.sql, so the recorded descriptions do not match the file names.
--   * Known column differences reported by inspection:
--       users        - has full_name, avatar_url; entity expects username
--       categories   - has icon, is_default; color is VARCHAR(20)
--       transactions - requires account_id; entity does not map it
--       budgets      - uses period enum (MONTHLY/YEARLY); entity expected month/currency
--
-- This migration is written to be ADDITIVE ONLY. It never drops, truncates or rewrites
-- existing rows.
--
-- NOTE ON THE "IF NOT EXISTS" GUARDS: MySQL 8.0 does NOT support
-- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` - that is MariaDB syntax and it is a
-- syntax error on MySQL 8.0.46. Every conditional statement below is therefore
-- written as a prepared statement whose SQL is chosen from an information_schema
-- lookup, which is the portable way to make an additive change idempotent here.
--
-- IMPORTANT: before running this, the actual schema must be inspected with SHOW CREATE TABLE
-- and the flyway_schema_history rows compared. If the applied migration checksums do not
-- match the files in src/main/resources/db/migration, Flyway will refuse to start unless
-- the history is reconciled deliberately - never by editing applied files or running
-- `flyway repair` without understanding the cause.

-- ---------------------------------------------------------------------------
-- 1. users: add full_name and avatar_url if the columns are genuinely missing.
--    `username` is kept so the existing entity mapping continues to work.
-- ---------------------------------------------------------------------------
SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name'
);
SET @s := IF(@c = 0,
    'ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL AFTER username',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url'
);
SET @s := IF(@c = 0,
    'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER full_name',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. categories: add icon and is_default, and widen color to match VARCHAR(20).
-- ---------------------------------------------------------------------------
SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'icon'
);
SET @s := IF(@c = 0,
    'ALTER TABLE categories ADD COLUMN icon VARCHAR(50) NULL AFTER color',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_default'
);
SET @s := IF(@c = 0,
    'ALTER TABLE categories ADD COLUMN is_default TINYINT(1) NOT NULL DEFAULT 0 AFTER icon',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE categories
    MODIFY COLUMN color VARCHAR(20) NULL DEFAULT '#4F46E5';

-- ---------------------------------------------------------------------------
-- 3. budgets: add the month and currency columns the application uses, and
--    make sure period exists. Existing rows keep their values; new rows get
--    sensible defaults derived from period.
-- ---------------------------------------------------------------------------
SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets' AND COLUMN_NAME = 'period'
);
SET @s := IF(@c = 0,
    'ALTER TABLE budgets ADD COLUMN period VARCHAR(20) NOT NULL DEFAULT ''MONTHLY'' AFTER category_id',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets' AND COLUMN_NAME = 'month'
);
SET @s := IF(@c = 0,
    'ALTER TABLE budgets ADD COLUMN month VARCHAR(7) NULL AFTER period',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets' AND COLUMN_NAME = 'currency'
);
SET @s := IF(@c = 0,
    'ALTER TABLE budgets ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT ''USD'' AFTER amount',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill month for rows that already have a budget, using the current month.
-- This only fills a NULL value; it never overwrites an existing month.
UPDATE budgets SET month = DATE_FORMAT(CURDATE(), '%Y-%m') WHERE month IS NULL;

-- ---------------------------------------------------------------------------
-- 4. transactions: add account_id as NULLABLE with a foreign key, so existing
--    transaction rows are preserved and remain valid. New transactions may
--    reference an account; accounts are optional for now.
-- ---------------------------------------------------------------------------
SET @c := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'account_id'
);
SET @s := IF(@c = 0,
    'ALTER TABLE transactions ADD COLUMN account_id BIGINT NULL AFTER category_id',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add the foreign key only if it does not already exist. MySQL 8 has no
-- "ADD CONSTRAINT IF NOT EXISTS", so this is guarded by the information_schema
-- lookup below.
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND CONSTRAINT_NAME = 'fk_transactions_account'
);

SET @fk_sql := IF(
    @fk_exists = 0,
    'ALTER TABLE transactions ADD CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL',
    'SELECT 1'
);

PREPARE stmt FROM @fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CREATE INDEX has no IF NOT EXISTS either, so it is guarded the same way.
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_tx_account'
);
SET @idx_sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_tx_account ON transactions (account_id)',
    'SELECT 1'
);
PREPARE stmt FROM @idx_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 5. Tables that exist in the database but are not reconciled by this migration
-- ---------------------------------------------------------------------------
-- savings_goals, goal_contributions and recurring_transactions already exist in
-- the `spendwise` database, but they were not created by V1__schema.sql,
-- V2__categories.sql or V3__transactions.sql - so their exact column definitions
-- are unknown from the repository alone.
--
-- The application now maps them as:
--
--   savings_goals        id, user_id, name, target_amount, current_amount,
--                         currency, deadline, is_completed, created_at
--   goal_contributions   id, goal_id, amount, contribution_date, notes, created_at
--   recurring_transactions
--                         id, user_id, category_id, name, type, amount, currency,
--                         frequency, interval_count, next_payment_date, is_active,
--                         created_at
--
-- Nothing is proposed for them here on purpose. Writing an ALTER for a column
-- whose current definition is unverified risks clobbering existing values. Run
-- SHOW CREATE TABLE on each of the three first; only if a column is genuinely
-- missing should a follow-up migration add it, with the same additive-only
-- rules used above.
--
-- The same applies to accounts, investments, lending_records and repayments,
-- which have no application code at all. They are left untouched.
--
-- ---------------------------------------------------------------------------
-- Rollback limitations
-- ---------------------------------------------------------------------------
-- Dropping the added columns would discard data that the application now writes
-- (users.full_name, users.avatar_url, categories.icon, categories.is_default,
-- budgets.month, budgets.currency, transactions.account_id). MySQL 8 supports
-- "ALTER TABLE ... DROP COLUMN" for these, but doing so would also remove the
-- existing rows' original values in cases where a column already existed with
-- a different definition. For that reason this migration is intended to be
-- forward-only and permanent.
--
-- Data impact summary:
--   * No existing row is deleted.
--   * No existing row's financial amount, date, category or ownership changes.
--   * Two new columns receive default values for existing budget rows (month and
--     currency); every other added column is nullable or defaulted.
--   * One index is added on transactions(account_id).
