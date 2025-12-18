-- Insert sample blog data for English learning website
-- This file populates: blog_categories, blogs, blog_tags, blog_post_tags, comments, and reactions

USE `app_db`;

-- ============================================
-- 1. INSERT BLOG CATEGORIES
-- ============================================
INSERT INTO `blog_categories` (`name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
('Grammar Tips', 'grammar-tips', 'Learn essential English grammar rules and tips', NOW(), NOW()),
('Vocabulary', 'vocabulary', 'Expand your English vocabulary with useful words and phrases', NOW(), NOW()),
('Pronunciation', 'pronunciation', 'Master English pronunciation and speaking skills', NOW(), NOW()),
('IELTS Preparation', 'ielts-preparation', 'Tips and strategies for IELTS exam preparation', NOW(), NOW()),
('Business English', 'business-english', 'Professional English for workplace communication', NOW(), NOW()),
('Study Tips', 'study-tips', 'Effective methods and strategies for learning English', NOW(), NOW()),
('Culture & Lifestyle', 'culture-lifestyle', 'English-speaking culture and lifestyle insights', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================
-- 2. INSERT BLOG TAGS
-- ============================================
INSERT INTO `blog_tags` (`name`, `slug`, `created_at`) VALUES
('beginner', 'beginner', NOW()),
('intermediate', 'intermediate', NOW()),
('advanced', 'advanced', NOW()),
('speaking', 'speaking', NOW()),
('writing', 'writing', NOW()),
('listening', 'listening', NOW()),
('reading', 'reading', NOW()),
('exam-tips', 'exam-tips', NOW()),
('daily-practice', 'daily-practice', NOW()),
('idioms', 'idioms', NOW()),
('phrasal-verbs', 'phrasal-verbs', NOW()),
('tenses', 'tenses', NOW()),
('common-mistakes', 'common-mistakes', NOW()),
('conversation', 'conversation', NOW()),
('academic', 'academic', NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================
-- 3. INSERT BLOGS
-- ============================================
-- Note: Assumes user_ids 1, 2, 3 exist from insert_users.sql

-- Blog 1: Grammar Tips
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    1, 1, 
    '10 Common Grammar Mistakes English Learners Make',
    '10-common-grammar-mistakes-english-learners-make',
    'Discover the 10 most common grammar mistakes that English learners make and learn how to avoid them with practical examples.',
    'published',
    '10 Common Grammar Mistakes English Learners Make | MonoLingo',
    'Learn about the most common grammar mistakes in English and how to avoid them. Perfect for intermediate and advanced learners.',
    1250,
    DATE_SUB(NOW(), INTERVAL 15 DAY),
    DATE_SUB(NOW(), INTERVAL 15 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 2: Vocabulary
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    1, 2,
    'Essential Business English Vocabulary for Meetings',
    'essential-business-english-vocabulary-meetings',
    'Learn the most important business English phrases and vocabulary for professional meetings and workplace communication.',
    'published',
    'Essential Business English Vocabulary for Meetings | MonoLingo',
    'Master professional meeting vocabulary with this comprehensive guide to business English phrases and expressions.',
    890,
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    DATE_SUB(NOW(), INTERVAL 10 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 3: IELTS Preparation
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    2, 4,
    'IELTS Writing Task 2: Complete Guide to Band 7+',
    'ielts-writing-task-2-complete-guide-band-7',
    'Complete guide to IELTS Writing Task 2 with strategies, structure, and tips to achieve Band 7 or higher.',
    'published',
    'IELTS Writing Task 2: Complete Guide to Band 7+ | MonoLingo',
    'Master IELTS Writing Task 2 with this comprehensive guide covering structure, strategies, and assessment criteria for Band 7+.',
    2150,
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 4: Pronunciation
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    2, 3,
    'How to Improve Your English Pronunciation: 7 Proven Techniques',
    'how-to-improve-english-pronunciation-7-techniques',
    'Discover 7 proven techniques to dramatically improve your English pronunciation and speak with confidence.',
    'published',
    'How to Improve Your English Pronunciation: 7 Proven Techniques',
    'Learn effective techniques to improve your English pronunciation with practical exercises and expert tips.',
    1680,
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 5: Study Tips
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`,   
    `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    1, 6,
    'The 30-Day English Learning Challenge: Daily Activities',
    '30-day-english-learning-challenge-daily-activities',
    'Take the 30-day English learning challenge with structured daily activities to improve your speaking, listening, reading, and writing skills.',
    'published',
    '30-Day English Learning Challenge: Daily Activities | MonoLingo',
    'Join our 30-day English learning challenge with daily structured activities to transform your English skills.',
    3420,
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 6: Vocabulary (Idioms)
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    3, 2,
    '20 Essential English Idioms for Daily Conversation',
    '20-essential-english-idioms-daily-conversation',
    'Learn 20 essential English idioms that native speakers use in daily conversations, complete with meanings and examples.',
    'published',
    '20 Essential English Idioms for Daily Conversation | MonoLingo',
    'Master common English idioms with this guide to 20 essential expressions used in everyday conversations.',
    2890,
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 7: Culture & Lifestyle
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    1, 7,
    'Understanding American vs British English: Key Differences',
    'understanding-american-vs-british-english-differences',
    'Explore the key differences between American and British English in spelling, vocabulary, and pronunciation.',
    'published',
    'American vs British English: Key Differences | MonoLingo',
    'Learn the main differences between American and British English including spelling, vocabulary, and pronunciation.',
    1560,
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Blog 8: Draft blog (not published yet)
INSERT INTO `blogs` (
    `user_id`, `category_id`, `title`, `slug`, `excerpt`, `status`, `meta_title`, `meta_description`, `view_count`, 
    `created_at`, `updated_at`
) VALUES (
    2, 1,
    'Advanced Grammar: Mastering the Subjunctive Mood',
    'advanced-grammar-mastering-subjunctive-mood',
    'Learn how to use the subjunctive mood in English for advanced grammar mastery.',
    'draft',
    'Advanced Grammar: Mastering the Subjunctive Mood | MonoLingo',
    'Master the subjunctive mood in English with this advanced grammar guide.',
    0,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================
-- 4. INSERT BLOG POST TAGS (Many-to-Many)
-- ============================================
-- Blog 1: Grammar Mistakes - Tags: intermediate, common-mistakes, writing
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(1, 2), -- intermediate
(1, 13), -- common-mistakes
(1, 5) -- writing
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 2: Business Vocabulary - Tags: intermediate, advanced, speaking, conversation
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(2, 2), -- intermediate
(2, 3), -- advanced
(2, 4), -- speaking
(2, 14) -- conversation
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 3: IELTS Writing - Tags: advanced, writing, exam-tips, academic
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(3, 3), -- advanced
(3, 5), -- writing
(3, 8), -- exam-tips
(3, 15) -- academic
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 4: Pronunciation - Tags: beginner, intermediate, speaking, daily-practice
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(4, 1), -- beginner
(4, 2), -- intermediate
(4, 4), -- speaking
(4, 9) -- daily-practice
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 5: 30-Day Challenge - Tags: beginner, intermediate, daily-practice, speaking, writing
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(5, 1), -- beginner
(5, 2), -- intermediate
(5, 9), -- daily-practice
(5, 4), -- speaking
(5, 5) -- writing
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 6: Idioms - Tags: intermediate, advanced, idioms, conversation
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(6, 2), -- intermediate
(6, 3), -- advanced
(6, 10), -- idioms
(6, 14) -- conversation
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 7: American vs British - Tags: beginner, intermediate, reading
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(7, 1), -- beginner
(7, 2), -- intermediate
(7, 7) -- reading
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- Blog 8: Subjunctive Mood - Tags: advanced, writing, academic
INSERT INTO `blog_post_tags` (`blog_id`, `tag_id`) VALUES
(8, 3), -- advanced
(8, 5), -- writing
(8, 15) -- academic
ON DUPLICATE KEY UPDATE `blog_id` = VALUES(`blog_id`);

-- ============================================
-- 5. INSERT COMMENTS
-- ============================================
-- Comments on Blog 1 (Grammar Mistakes)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(1, 2, 'This is so helpful! I always confused "its" and "it''s". Thanks for the clear explanation!', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
(1, 3, 'Great article! Could you write more about prepositions? That''s my biggest challenge.', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
(1, 2, 'The subject-verb agreement section was particularly useful. I''ve been making this mistake for years!', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY))
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Comments on Blog 2 (Business Vocabulary)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(2, 3, 'Perfect timing! I have a business meeting next week. These phrases will be very useful.', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 1, 'As someone who uses English at work daily, I can confirm these are essential phrases. Well done!', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY))
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Comments on Blog 3 (IELTS Writing)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(3, 2, 'I''m taking the IELTS exam next month. This guide is exactly what I needed. Thank you!', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 3, 'The essay structure section is brilliant. I''ve been struggling with organization.', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 1, 'Could you provide some sample essays for different question types?', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Comments on Blog 4 (Pronunciation)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(4, 1, 'Recording myself was eye-opening! I never realized how different my pronunciation was.', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4, 3, 'The tongue twister technique really works! My pronunciation has improved significantly.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Comments on Blog 5 (30-Day Challenge)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(5, 2, 'I''m starting this challenge today! Will update my progress here.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 3, 'Day 7 completed! Already feeling more confident with my vocabulary.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 1, 'This is a great structured approach. I''m recommending it to all my students!', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Comments on Blog 6 (Idioms)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(6, 1, 'I love learning idioms! They make conversations so much more interesting.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 2, 'Could you explain the origin of "break the bank"? I''m curious about the history.', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Comments on Blog 7 (American vs British)
INSERT INTO `comments` (`blog_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(7, 3, 'As someone learning British English, this comparison is very helpful!', NOW(), NOW()),
(7, 2, 'I didn''t know there were so many differences. Very informative!', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================
-- 6. INSERT REACTIONS
-- ============================================
-- Reactions on Blogs
INSERT INTO `reactions` (`user_id`, `blog_id`, `comment_id`, `created_at`, `updated_at`) VALUES
-- Blog 1 reactions
(2, 1, NULL, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
(3, 1, NULL, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),

-- Blog 2 reactions
(1, 2, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, 2, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),

-- Blog 3 reactions
(1, 3, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 3, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 3, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Blog 4 reactions
(1, 4, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 4, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Blog 5 reactions
(1, 5, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 5, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 5, NULL, NOW(), NOW()),

-- Blog 6 reactions
(1, 6, NULL, NOW(), NOW()),
(2, 6, NULL, NOW(), NOW()),

-- Blog 7 reactions
(1, 7, NULL, NOW(), NOW()),
(3, 7, NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Reactions on Comments
INSERT INTO `reactions` (`user_id`, `blog_id`, `comment_id`, `created_at`, `updated_at`) VALUES
-- Reactions on comments for Blog 1
(1, NULL, 1, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
(3, NULL, 2, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
(2, NULL, 3, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),

-- Reactions on comments for Blog 2
(1, NULL, 4, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, NULL, 5, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),

-- Reactions on comments for Blog 3
(2, NULL, 6, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, NULL, 7, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, NULL, 8, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Reactions on comments for Blog 4
(2, NULL, 9, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, NULL, 10, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Reactions on comments for Blog 5
(1, NULL, 11, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, NULL, 12, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, NULL, 13, NOW(), NOW()),

-- Reactions on comments for Blog 6
(2, NULL, 14, NOW(), NOW()),
(1, NULL, 15, NOW(), NOW()),

-- Reactions on comments for Blog 7
(2, NULL, 16, NOW(), NOW()),
(3, NULL, 17, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================
-- SUMMARY
-- ============================================
-- This file has inserted:
-- - 7 blog categories
-- - 15 blog tags
-- - 8 blogs (7 published, 1 draft)
-- - Multiple blog-tag relationships
-- - 17 comments across different blogs
-- - Multiple reactions on both blogs and comments
--
-- All data is realistic for an English learning website
-- and demonstrates the relationships between tables.
-- ============================================
