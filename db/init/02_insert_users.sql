-- Insert sample users for testing login functionality
-- Password for all users: password123 (hashed with bcrypt)
-- 
-- IMPORTANT: All password hashes below are valid bcrypt hashes for 'password123'
-- Generated using: App\Core\Hash::make('password123')

USE `app_db`;

-- Insert Admin user
-- Email: admin@monolingo.com
-- Password: password123
INSERT INTO `accounts` (
    `name`, 
    `email`, 
    `password`, 
    `role`, 
    `points`, 
    `ranking`, 
    `rating`,
    `verify_email_token`,
    `reset_password_token`,
    `created_at`,
    `updated_at`
) VALUES (
    'Admin User',
    'admin@monolingo.com',
    '$2y$10$/x3zyLoYHEAeksUtqUeuZej1K4CISsHpW4sXZd7ySVUnrdbnNSCjG', -- password123 (valid bcrypt hash)
    'admin',
    0,
    'bronze',
    0.0,
    NULL,
    NULL,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Insert Student user
-- Email: student@monolingo.com
-- Password: password123
INSERT INTO `accounts` (
    `name`, 
    `email`, 
    `password`, 
    `role`, 
    `points`, 
    `ranking`, 
    `rating`,
    `verify_email_token`,
    `reset_password_token`,
    `created_at`,
    `updated_at`
) VALUES (
    'Student User',
    'student@monolingo.com',
    '$2y$10$/x3zyLoYHEAeksUtqUeuZej1K4CISsHpW4sXZd7ySVUnrdbnNSCjG', -- password123 (valid bcrypt hash)
    'user',
    500,
    'bronze',
    0.0,
    NULL,
    NULL,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Insert another student for testing
-- Email: test@monolingo.com
-- Password: password123
INSERT INTO `accounts` (
    `name`, 
    `email`, 
    `password`, 
    `role`, 
    `points`, 
    `ranking`, 
    `rating`,
    `verify_email_token`,
    `reset_password_token`,
    `created_at`,
    `updated_at`
) VALUES (
    'Test Student',
    'test@monolingo.com',
    '$2y$10$/x3zyLoYHEAeksUtqUeuZej1K4CISsHpW4sXZd7ySVUnrdbnNSCjG', -- password123 (valid bcrypt hash)
    'user',
    1200,
    'silver',
    0.0,
    NULL,
    NULL,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================
-- HOW TO GENERATE PASSWORD HASH:
-- ============================================
-- Option 1: Using PHP script
--   cd db/init
--   php generate_password_hash.php password123
--
-- Option 2: Using PHP code
--   <?php
--   require_once 'backend/Core/Hash.php';
--   use App\Core\Hash;
--   echo Hash::make('password123');
--
-- Option 3: Online tool
--   https://bcrypt-generator.com/
--   Enter password: password123
--   Copy the generated hash
--
-- ============================================
-- TEST ACCOUNTS:
-- ============================================
-- Admin:     admin@monolingo.com / password123
-- Student:   student@monolingo.com / password123
-- Test:      test@monolingo.com / password123

