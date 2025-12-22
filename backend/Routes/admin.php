<?php

use App\Controllers\AdminExamController;
use App\Controllers\AdminController;

// Admin Exam Routes
$router->get('/api/admin/exams', [AdminExamController::class, '@getExams']);
$router->post('/api/admin/exams', [AdminExamController::class, '@createExam']);
$router->post('/api/admin/exams/import', [AdminExamController::class, '@import']);
$router->delete('/api/admin/exams/:id', [AdminExamController::class, '@deleteExam']);

// Admin User Routes
$router->get('/api/admin/users', [AdminController::class, '@getUsers']);
$router->put('/api/admin/users/:id', [AdminController::class, '@updateUser']);
$router->delete('/api/admin/users/:id', [AdminController::class, '@deleteUser']);

// Admin Blog Routes (Moderation)
$router->get('/api/admin/blogs', [AdminController::class, '@getBlogs']);
$router->put('/api/admin/blogs/:id', [AdminController::class, '@updateBlog']);
$router->delete('/api/admin/blogs/:id', [AdminController::class, '@deleteBlog']);

// Admin Dashboard Stats
$router->get('/api/admin/stats', [AdminController::class, '@getStats']);
