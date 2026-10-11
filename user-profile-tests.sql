
-- Student Budget Tracker
-- User and User Profiles Database Testing
-- Schema: studentbudget
--
-- Tests: INSERT, SELECT, UPDATE, DELETE, JOIN,
-- and foreign key constraints.
--
-- Write operations are commented out to protect
-- our shared database from accidental changes.

USE studentbudget;


-- 1. VIEW BOTH TABLES

SELECT user_id, email, first_name, last_name
FROM user;

SELECT *
FROM user_profiles;


-- 2. INSERT TEST USER AND PROFILE
-- Previously executed for user_id = 12.

-- INSERT INTO user
--     (email, password_hash, first_name, last_name, created_at)
-- VALUES
--     ('john.sqltest@example.com', 'test_hash',
--      'John', 'Test', NOW());

-- INSERT INTO user_profiles
--     (user_id, display_name, profile_image, bio)
-- VALUES
--     (12, 'Alex Test', NULL, 'Testing user profiles');


-- 3. INSERT ADDITIONAL PROFILES
-- For existing users 4, 8, and 9.
-- Uncomment only if these profiles are still missing.

-- INSERT INTO user_profiles
--     (user_id, display_name, profile_image, bio)
-- SELECT
--     u.user_id,
--     CASE u.user_id
--         WHEN 4 THEN 'Budget Tester'
--         WHEN 8 THEN 'Student Saver'
--         WHEN 9 THEN 'My Budget'
--     END,
--     NULL,
--     CASE u.user_id
--         WHEN 4 THEN 'Tracking monthly income and expenses'
--         WHEN 8 THEN 'Saving money while attending college'
--         WHEN 9 THEN 'Managing my personal budget'
--     END
-- FROM user u
-- LEFT JOIN user_profiles p
--     ON u.user_id = p.user_id
-- WHERE u.user_id IN (4, 8, 9)
--   AND p.profile_id IS NULL;


-- 4. INNER JOIN
-- Show users with matching profiles.

SELECT
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    p.display_name,
    p.bio
FROM user u
JOIN user_profiles p
ON u.user_id = p.user_id;


-- 5. UPDATE TEST
-- Previously executed for user_id = 12.

-- UPDATE user_profiles
-- SET bio = 'Updated profile successfully'
-- WHERE user_id = 12;

SELECT *
FROM user_profiles
WHERE user_id = 12;


-- 6. DELETE TEST
-- Temporary profile created and deleted separately.
-- Only mark complete after verifying the deletion.

-- DELETE p
-- FROM user_profiles p
-- JOIN user u ON p.user_id = u.user_id
-- WHERE u.email = 'delete.test@example.com';


-- 7. FOREIGN KEY CONSTRAINT TEST
-- Confirm the invalid user does not exist.

SELECT user_id
FROM user
WHERE user_id = 999999;

-- Expected Error 1452 when executed separately.

-- INSERT INTO user_profiles
--     (user_id, display_name, bio)
-- VALUES
--     (999999, 'Invalid Profile', 'Foreign key test');


-- 8. FINAL VERIFICATION

SELECT
    u.user_id,
    u.first_name,
    u.last_name,
    p.display_name,
    p.bio
FROM user u
LEFT JOIN user_profiles p
ON u.user_id = p.user_id
ORDER BY u.user_id;

SELECT COUNT(*) AS total_users
FROM user;

SELECT COUNT(*) AS total_profiles
FROM user_profiles;

-- END OF SCRIPT