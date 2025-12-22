<?php

use App\Controllers\ExamController;

// Exam Routes

// List or Detail
$router->get('/api/exams', [ExamController::class, '@index']);

// Submit
$router->post('/api/exams/submit', [ExamController::class, '@submit']);

// Result
$router->get('/api/exams/result', [ExamController::class, '@result']);

// User's exam attempts (for Dashboard)
$router->get('/api/exams/my-attempts', [ExamController::class, '@myAttempts']);
