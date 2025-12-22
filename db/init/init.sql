CREATE DATABASE IF NOT EXISTS `app_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `app_db`;

-- Accounts table
CREATE TABLE IF NOT EXISTS `accounts` (
  `user_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NULL,
  `phone` VARCHAR(15),
  `address` TEXT,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `auth_provider` ENUM('local', 'google') DEFAULT 'local',
  `google_uid` VARCHAR(128) NULL,
  `points` SMALLINT DEFAULT 0,
  `ranking` ENUM('bronze', 'silver', 'gold', 'diamond') DEFAULT 'bronze',
  `verify_email_token` VARCHAR(255),
  `verify_token_expires_at` TIMESTAMP NULL,
  `rating` DECIMAL(2,1) DEFAULT 0,
  `reset_password_token` VARCHAR(255),
  `reset_password_expires_at` TIMESTAMP NULL,
  `avatar` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_google_uid` (`google_uid`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Course types table
CREATE TABLE IF NOT EXISTS `course_types` (
  `course_type_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Discounts table
CREATE TABLE IF NOT EXISTS `discounts` (
  `discount_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(255) NOT NULL UNIQUE,
  `start_date` DATE,
  `end_date` DATE,
  `percent` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Courses table
CREATE TABLE IF NOT EXISTS `courses` (
  `course_id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_type_id` INT NOT NULL,
  `discount_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `duration` INT COMMENT 'Duration in seconds or minutes',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  `level` ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`course_type_id`) ON DELETE CASCADE,
  FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`discount_id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Course images table
CREATE TABLE IF NOT EXISTS `course_images` (
  `image_id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT,
  `image_url` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Skills table
CREATE TABLE IF NOT EXISTS `skills` (
  `skill_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Course skills table
CREATE TABLE IF NOT EXISTS `course_skills` (
  `course_id` INT,
  `skill_id` INT,
  PRIMARY KEY (`course_id`, `skill_id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE,
  FOREIGN KEY (`skill_id`) REFERENCES `skills`(`skill_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Chapters table
CREATE TABLE IF NOT EXISTS `chapters` (
  `chapter_id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Lessons table
CREATE TABLE IF NOT EXISTS `lessons` (
  `lesson_id` INT PRIMARY KEY AUTO_INCREMENT,
  `chapter_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `type` ENUM('video', 'text', 'quiz', 'assignment') DEFAULT 'video',
  `content` VARCHAR(255),
  `content_text` TEXT,
  `duration_seconds` INT DEFAULT 0,
  `is_preview` BOOLEAN DEFAULT FALSE,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Enrollments table
CREATE TABLE IF NOT EXISTS `enrollments` (
  `enrollment_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  `progress_percent` INT DEFAULT 0,
  `finished_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Lesson progress table
CREATE TABLE IF NOT EXISTS `lesson_progress` (
  `progress_id` INT PRIMARY KEY AUTO_INCREMENT,
  `enrollment_id` INT NOT NULL,
  `lesson_id` INT NOT NULL,
  `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  `last_watched_seconds` INT DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`enrollment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`lesson_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE IF NOT EXISTS `reviews` (
  `review_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `rating` DECIMAL(2,1) NOT NULL, -- Ví dụ: 4.5
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
  `final_amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  `payment_method` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` INT PRIMARY KEY AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `course_id` INT,
  `price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Blog categories table
CREATE TABLE IF NOT EXISTS `blog_categories` (
  `category_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Blogs table
CREATE TABLE IF NOT EXISTS `blogs` (
  `blog_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `category_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `excerpt` TEXT,
  `featured_image` VARCHAR(255),
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  `meta_title` VARCHAR(255),
  `meta_description` TEXT,
  `view_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`category_id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Blog tags table
CREATE TABLE IF NOT EXISTS `blog_tags` (
  `tag_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Blog post tags table
CREATE TABLE IF NOT EXISTS `blog_post_tags` (
  `blog_id` INT,
  `tag_id` INT,
  PRIMARY KEY (`blog_id`, `tag_id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`blog_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `blog_tags`(`tag_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Exams table
CREATE TABLE IF NOT EXISTS `exams` (
  `exam_id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration_minutes` INT DEFAULT 60,
  `total_questions` INT DEFAULT 0,
  `type` VARCHAR(20) DEFAULT 'readlis', -- readlis, speaking, writting
  `year` INT,
  `audio_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Exam Question Groups table
CREATE TABLE IF NOT EXISTS `exam_question_groups` (
  `group_id` INT PRIMARY KEY AUTO_INCREMENT,
  `exam_id` INT NOT NULL,
  `part_number` INT NOT NULL COMMENT '1 to 7',
  `content_text` TEXT COMMENT 'For Reading passages',
  `image_url` VARCHAR(255) COMMENT 'For Part 1, 7',
  `audio_url` VARCHAR(255) COMMENT 'For Part 1-4',
  `transcript` TEXT COMMENT 'For Listening parts',
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Exam Questions table
CREATE TABLE IF NOT EXISTS `exam_questions` (
  `question_id` INT PRIMARY KEY AUTO_INCREMENT,
  `exam_id` INT NOT NULL,
  `group_id` INT,
  `part_number` INT NOT NULL COMMENT '1 to 7',
  `question_number` INT NOT NULL,
  `question_text` TEXT,
  `options` JSON DEFAULT NULL,
  `correct_answer` VARCHAR(10) DEFAULT NULL,
  `explanation` TEXT,
  `question_type` VARCHAR(50) DEFAULT NULL,
  `image_urls` JSON DEFAULT NULL,
  `audio_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE,
  FOREIGN KEY (`group_id`) REFERENCES `exam_question_groups`(`group_id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Exam Attempts table
CREATE TABLE IF NOT EXISTS `exam_attempts` (
  `attempt_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `exam_id` INT NOT NULL,
  `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `end_time` TIMESTAMP NULL,
  `score_listening` INT DEFAULT 0,
  `score_reading` INT DEFAULT 0,
  `total_score` INT DEFAULT 0,
  `status` ENUM('in_progress', 'completed') DEFAULT 'in_progress',
  FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Exam Attempt Answers table
CREATE TABLE IF NOT EXISTS `exam_attempt_answers` (
  `answer_id` INT PRIMARY KEY AUTO_INCREMENT,
  `attempt_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `selected_option` VARCHAR(10),
  `is_correct` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`attempt_id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `exam_questions`(`question_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

