<?php

use App\Controllers\BlogController;
use App\Controllers\CommentController;
use App\Controllers\ReactionController;

// Load BlogImageController
require_once __DIR__ . '/../Controllers/BlogImageController.php';

// ==================== Blog Routes ====================

// Public routes - Get blogs
$router->get('/api/blogs', [BlogController::class, '@index']);
$router->get('/api/blogs/show', [BlogController::class, '@show']);
$router->get('/api/blogs/content', [BlogController::class, '@getContent']);
$router->get('/api/blogs/category', [BlogController::class, '@byCategory']);
$router->get('/api/blogs/tag', [BlogController::class, '@byTag']);

// Categories and Tags
$router->get('/api/blog-categories', [BlogController::class, '@getCategories']);
$router->get('/api/blog-tags', [BlogController::class, '@getTags']);

// Protected routes - Require authentication
$router->post('/api/blogs', [BlogController::class, '@create']);
$router->put('/api/blogs', [BlogController::class, '@update']);
$router->delete('/api/blogs', [BlogController::class, '@delete']);
$router->get('/api/blogs/my-blogs', [BlogController::class, '@myBlogs']);

// Image upload routes (Protected)
$router->post('/api/blogs/featured-image', ['BlogImageController', '@uploadFeaturedImage']);
$router->post('/api/blogs/images', ['BlogImageController', '@uploadInlineImages']);

// ==================== Comment Routes ====================

// Public - Get comments
$router->get('/api/comments', [CommentController::class, '@index']);

// Protected - Create, Update, Delete comments
$router->post('/api/comments', [CommentController::class, '@create']);
$router->put('/api/comments', [CommentController::class, '@update']);
$router->delete('/api/comments', [CommentController::class, '@delete']);

// ==================== Reaction Routes ====================

// Get reaction info
$router->get('/api/reactions', [ReactionController::class, '@show']);

// Toggle reaction (Protected)
$router->post('/api/reactions', [ReactionController::class, '@toggle']);
