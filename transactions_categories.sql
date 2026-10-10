-- Student Budget Tracker
-- Assignment: Transactions + Categories
-- Schema: studentbudget
--
-- Purpose:
-- 1. Inspect the transactions and categories tables.
-- 2. Add sample categories and transactions.
-- 3. Test SELECT and JOIN queries.
-- 4. Test UPDATE and DELETE.
-- 5. Verify foreign-key constraints.
--
-- IMPORTANT:
-- This script documents the work performed against the shared database.
-- Do not run the entire file at once. INSERT statements can create duplicates,
-- and UPDATE/DELETE statements can modify or remove records.
-- Statements marked "ALREADY EXECUTED" are included as a record of the tests.

USE studentbudget;


-- =========================================================
-- 1. INSPECT TABLES AND DATA
-- These queries are read-only and safe to run again.
-- =========================================================

SHOW TABLES;

DESCRIBE transactions;
DESCRIBE categories;

SHOW CREATE TABLE transactions;
SHOW CREATE TABLE categories;

SELECT user_id, email
FROM `user`
LIMIT 10;

SELECT *
FROM categories;

SELECT *
FROM transactions
LIMIT 10;

SELECT COUNT(*) AS total_categories
FROM categories;


-- =========================================================
-- 2. INSERT TEST CATEGORIES
-- ALREADY EXECUTED.
-- Do not run again unless you intend to add duplicate categories.
-- =========================================================

-- INSERT INTO categories (name, type)
-- VALUES
--     ('Food', 'Expense'),
--     ('Transportation', 'Expense'),
--     ('Salary', 'Income'),
--     ('Entertainment', 'Expense');


-- =========================================================
-- 3. INSERT TEST TRANSACTIONS
-- ALREADY EXECUTED.
-- Test user: user_id = 4
-- Category IDs used: 1 = Food, 2 = Transportation, 3 = Salary
-- Do not run again unless you intend to create new test rows.
-- =========================================================

-- INSERT INTO transactions
--     (user_id, type, description, category_id, amount, transaction_date)
-- VALUES
--     (4, 'Expense', 'Test grocery purchase', 1, 45.50, NOW()),
--     (4, 'Expense', 'Test bus fare', 2, 12.00, NOW()),
--     (4, 'Income', 'Test paycheck', 3, 500.00, NOW());


-- =========================================================
-- 4. SELECT TEST: VIEW TEST TRANSACTIONS
-- Read-only; safe to run again.
-- =========================================================

SELECT
    transaction_id,
    user_id,
    type,
    description,
    category_id,
    amount,
    transaction_date
FROM transactions
WHERE user_id = 4
  AND description IN (
      'Test grocery purchase',
      'Updated test grocery purchase',
      'Test bus fare',
      'Test paycheck'
  )
ORDER BY transaction_id;


-- =========================================================
-- 5. JOIN TEST: TRANSACTIONS WITH CATEGORY NAMES
-- Read-only; safe to run again.
-- Confirms transactions return their corresponding category names.
-- =========================================================

SELECT
    t.transaction_id,
    t.user_id,
    t.description,
    c.name AS category,
    c.type AS category_type,
    t.type AS transaction_type,
    t.amount,
    t.transaction_date
FROM transactions AS t
JOIN categories AS c
    ON t.category_id = c.category_id
WHERE t.user_id = 4
ORDER BY t.transaction_id;


-- =========================================================
-- 6. UPDATE TEST
-- ALREADY EXECUTED on transaction_id = 1, then that row was deleted.
-- Kept commented out so it does not modify any data if the file is run.
-- =========================================================

-- UPDATE transactions
-- SET amount = 50.00,
--     description = 'Updated test grocery purchase'
-- WHERE transaction_id = 1
--   AND user_id = 4;

-- Verify the update (transaction_id 1 was later deleted).
-- SELECT transaction_id, description, amount
-- FROM transactions
-- WHERE transaction_id = 1;


-- =========================================================
-- 7. DELETE TEST AND DUPLICATE CLEANUP
-- ALREADY EXECUTED.
-- Transaction 1 was deleted after the UPDATE test.
-- Duplicate test rows 5-9 and later rows 10-12 were cleaned up.
-- These DELETE statements are intentionally commented out.
-- =========================================================

-- DELETE FROM transactions
-- WHERE transaction_id = 1
--   AND user_id = 4;

-- DELETE FROM transactions
-- WHERE user_id = 4
--   AND transaction_id IN (5, 6, 7, 8, 9);

-- DELETE FROM transactions
-- WHERE user_id = 4
--   AND transaction_id IN (10, 11, 12);


-- =========================================================
-- 8. VERIFY REMAINING TEST TRANSACTIONS
-- Read-only; safe to run again.
-- Expected retained rows from the completed test:
-- IDs 2 (bus fare), 3 (paycheck), and 4 (grocery purchase).
-- =========================================================

SELECT
    transaction_id,
    user_id,
    description,
    category_id,
    amount
FROM transactions
WHERE user_id = 4
  AND transaction_id IN (2, 3, 4)
ORDER BY transaction_id;


-- =========================================================
-- 9. FOREIGN-KEY CONSTRAINT TESTS
-- Both tests were ALREADY EXECUTED and rejected by MySQL with Error 1452.
-- The INSERT statements are commented out because failure is expected.
-- =========================================================

-- Test A: Invalid user ID. Expected: Error 1452, fk_transaction_user.
-- INSERT INTO transactions
--     (user_id, type, description, category_id, amount, transaction_date)
-- VALUES
--     (999999, 'Expense', 'Invalid user constraint test',
--      1, 10.00, NOW());

-- Test B: Invalid category ID. Expected: Error 1452, fk_transactions_category.
-- INSERT INTO transactions
--     (user_id, type, description, category_id, amount, transaction_date)
-- VALUES
--     (4, 'Expense', 'Invalid category constraint test',
--      999999, 10.00, NOW());


-- =========================================================
-- 10. OPTIONAL DUPLICATE CHECK
-- Read-only; safe to run again.
-- =========================================================

SELECT
    description,
    COUNT(*) AS copies
FROM transactions
WHERE user_id = 4
  AND description IN (
      'Test grocery purchase',
      'Updated test grocery purchase',
      'Test bus fare',
      'Test paycheck'
  )
GROUP BY description;

-- END OF SCRIPT
