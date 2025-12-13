<?php

use App\Controllers\AuthController;


// Login
$router->post('/api/auth/login', [AuthController::class, '@login']);

// Register
$router->post('/api/auth/register', [AuthController::class, '@register']);

// OTP Verification (after registration)
$router->get('/api/auth/register/otp', AuthController::class . '@showRegisterOtp');
$router->post('/api/auth/register/otp/verify', AuthController::class . '@verifyOtp');
$router->post('/api/auth/register/otp/resend', AuthController::class . '@resendOtp');

// Forgot Password
$router->get('/api/auth/forgot-password', AuthController::class . '@showForgotPassword');
$router->post('/api/auth/forgot-password', AuthController::class . '@forgotPassword');

// Reset Password
$router->get('/api/auth/reset-password', AuthController::class . '@showResetPassword');
$router->post('/api/auth/reset-password', AuthController::class . '@resetPassword');

// Logout
$router->post('/api/auth/logout', AuthController::class . '@logout');

// Token Refresh
$router->post('/api/auth/refresh', AuthController::class . '@refresh');

// Current User
$router->get('/api/auth/me', AuthController::class . '@me');