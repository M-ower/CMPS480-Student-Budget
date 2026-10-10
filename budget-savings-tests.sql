-- CMPS480 Student Budget Project
-- Module 3 Part B: Budgets and Savings Goals Tests
-- Database: studentbudget
-- Test user: user_id = 4
-- Review before running any INSERT, UPDATE, or DELETE on the live database.

-- =====================================================
-- 1. CHECK TABLE STRUCTURES
-- =====================================================

DESCRIBE studentbudget.budgets;
DESCRIBE studentbudget.savings_goals;

-- =====================================================
-- 2. FIND THE TEST USER
-- =====================================================

SELECT user_id, email, first_name, last_name
FROM studentbudget.`user`
WHERE email = 'budget.test@example.com';
-- =====================================================
-- 3. BUDGETS: INSERT 3 MONTHLY BUDGETS
-- Run only after confirming these test records do not
-- already exist for user_id 4.
-- =====================================================

-- INSERT INTO studentbudget.budgets
--     (user_id, amount, budget_month)
-- VALUES
--     (4, 300.00, '2099-04-01'),
--     (4, 450.00, '2099-05-01'),
--     (4, 500.00, '2099-06-01');

-- =====================================================
-- 4. BUDGETS: SELECT FOR A SPECIFIC USER
-- =====================================================

SELECT *
FROM studentbudget.budgets
WHERE user_id = 4;

-- =====================================================
-- 5. BUDGETS: SORT BY MONTH
-- =====================================================

SELECT *
FROM studentbudget.budgets
WHERE user_id = 4
ORDER BY budget_month ASC;

-- =====================================================
-- 6. BUDGETS: UPDATE ONE TEST BUDGET
-- Run after inserting the matching test record.
-- =====================================================

-- UPDATE studentbudget.budgets
-- SET amount = 350.00
-- WHERE user_id = 4
--   AND budget_month = '2099-04-01'
--   AND amount = 300.00;

-- =====================================================
-- 7. BUDGETS: DELETE ONE TEST BUDGET
-- Run only when the matching test record exists.
-- =====================================================

-- DELETE FROM studentbudget.budgets
-- WHERE user_id = 4
--   AND budget_month = '2099-04-01'
--   AND amount = 350.00
-- LIMIT 1;

-- =====================================================
-- 8. BUDGETS: TEST INVALID USER ID
-- Expected result: foreign-key constraint error.
-- Run separately; do not expect this INSERT to succeed.
-- =====================================================

-- INSERT INTO studentbudget.budgets
--     (user_id, amount, budget_month)
-- VALUES (999999, 100.00, '2099-07-01');

-- =====================================================
-- 9. SAVINGS GOALS: INSERT 3 TEST GOALS
-- Run only after confirming these goals do not already
-- exist for user_id 4.
-- =====================================================

-- INSERT INTO studentbudget.savings_goals
--     (user_id, goal_name, target_amount, current_amount, target_date)
-- VALUES
--     (4, 'SQL Test Laptop', 1000.00, 100.00, '2099-08-01'),
--     (4, 'SQL Test Car', 5000.00, 250.00, '2099-09-01'),
--     (4, 'SQL Test Emergency Fund', 2000.00, 50.00, '2099-10-01');

-- =====================================================
-- 10. SAVINGS GOALS: SELECT FOR A SPECIFIC USER
-- =====================================================

SELECT *
FROM studentbudget.savings_goals
WHERE user_id = 4;

-- =====================================================
-- 11. SAVINGS GOALS: UPDATE CURRENT SAVINGS
-- Run after inserting the matching test goal.
-- =====================================================

-- UPDATE studentbudget.savings_goals
-- SET current_amount = 150.00
-- WHERE user_id = 4
--   AND goal_name = 'SQL Test Laptop'
--   AND current_amount = 100.00;

-- =====================================================
-- 12. SAVINGS GOALS: DELETE ONE TEST GOAL
-- Run only when the matching test goal exists.
-- =====================================================

-- DELETE FROM studentbudget.savings_goals
-- WHERE user_id = 4
--   AND goal_name = 'SQL Test Laptop'
--   AND current_amount = 150.00
-- LIMIT 1;

-- =====================================================
-- 13. SAVINGS GOALS: TEST INVALID USER ID
-- Expected result: foreign-key constraint error.
-- Run separately; do not expect this INSERT to succeed.
-- =====================================================

-- INSERT INTO studentbudget.savings_goals
--     (user_id, goal_name, target_amount, current_amount, target_date)
-- VALUES (999999, 'Invalid User Test', 100.00, 0.00, '2099-11-01');

-- =====================================================
-- 14. CALCULATE TOTAL SAVINGS FOR THE TEST USER
-- =====================================================

SELECT COALESCE(SUM(current_amount), 0.00) AS total_current_savings
FROM studentbudget.savings_goals
WHERE user_id = 4;

-- =====================================================
-- 15. VERIFY REMAINING TEST RECORDS
-- =====================================================

SELECT COUNT(*) AS remaining_budgets
FROM studentbudget.budgets
WHERE user_id = 4
AND budget_month IN ('2099-04-01', '2099-05-01', '2099-06-01');

SELECT COUNT(*) AS remaining_savings_goals
FROM studentbudget.savings_goals
WHERE user_id = 4
AND goal_name IN (
'SQL Test Laptop',
'SQL Test Car',
'SQL Test Emergency Fund'
);