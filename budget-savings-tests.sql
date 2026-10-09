-- CMPS480 Student Budget Project
-- Module 3 Part B: Budgets and Savings Goals Tests

-- Check table structures
DESCRIBE studentbudget.budgets;
DESCRIBE studentbudget.savings_goals;

-- Find the test user
SELECT user_id, email, first_name, last_name
FROM studentbudget.`user`
WHERE email = 'budget.test@example.com';

-- Check remaining test budgets
SELECT COUNT(*) AS remaining_budgets
FROM studentbudget.budgets
WHERE user_id = 4;

-- Check remaining test savings goals
SELECT COUNT(*) AS remaining_savings_goals
FROM studentbudget.savings_goals
WHERE user_id = 4;

-- Temporary test records were deleted after CRUD testing.