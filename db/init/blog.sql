-- Blog System Database Schema
-- This file creates tables for blog posts, comments, and likes

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    featured_image VARCHAR(500) DEFAULT NULL,
    views INT NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_slug (slug),
    INDEX idx_created_at (created_at),
    INDEX idx_is_published (is_published),
    INDEX idx_is_featured (is_featured),
    FULLTEXT idx_search (title, content, excerpt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Comments Table
CREATE TABLE IF NOT EXISTS blog_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    content TEXT NOT NULL,
    is_approved TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Likes Table
CREATE TABLE IF NOT EXISTS blog_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample blog posts (for testing)
INSERT INTO blog_posts (user_id, title, slug, content, excerpt, category, views, is_published, is_featured) VALUES
(1, '10 Effective Tips to Improve Your English Speaking Skills', '10-effective-tips-improve-english-speaking', 
'<p>Discover proven strategies to boost your confidence and fluency in English conversations. This comprehensive guide covers everything from daily practice routines to advanced techniques used by language experts.</p><p>Whether you are a beginner or looking to refine your skills, these tips will help you speak English more naturally and confidently.</p>',
'Discover proven strategies to boost your confidence and fluency in English conversations.',
'Learning Tips', 2543, 1, 1)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO blog_posts (user_id, title, slug, content, excerpt, category, views, is_published, is_featured) VALUES
(2, 'How AI is Revolutionizing Language Learning', 'ai-revolutionizing-language-learning',
'<p>Explore how artificial intelligence is personalizing English learning experiences for millions of learners worldwide.</p><p>From adaptive learning algorithms to AI-powered conversation partners, discover the future of language education.</p>',
'Explore how artificial intelligence is personalizing English learning experiences for millions.',
'Technology', 1892, 1, 0)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO blog_posts (user_id, title, slug, content, excerpt, category, views, is_published, is_featured) VALUES
(3, 'Common Mistakes Beginners Make and How to Avoid Them', 'common-mistakes-beginners-avoid',
'<p>Learn the most common pitfalls in English learning and practical solutions to overcome them.</p><p>This article identifies frequent errors made by beginners and provides actionable advice to help you progress faster.</p>',
'Learn the most common pitfalls in English learning and practical solutions to overcome them.',
'Learning Tips', 3102, 1, 0)
ON DUPLICATE KEY UPDATE id=id;

