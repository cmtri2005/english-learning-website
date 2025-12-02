<?php

use App\Controllers\AuthController;

$router->post('/login', [AuthController::class, '@login']);
$router->post('/api/auth/login', [AuthController::class, '@login']);

$router->post('/api/auth/register', [AuthController::class, '@register']);

$router->get('/register/otp', AuthController::class . '@showRegisterOtp');
$router->post('/register/otp/verify', AuthController::class . '@verifyOtp');
$router->post('/register/otp/resend', AuthController::class . '@resendOtp');

$router->get('/forgot-password', AuthController::class . '@showForgotPassword');
$router->post('/forgot-password', AuthController::class . '@forgotPassword');

$router->get('/reset-password', AuthController::class . '@showResetPassword');
$router->post('/reset-password', AuthController::class . '@resetPassword');

$router->post('/api/auth/logout', AuthController::class . '@logout');
$router->post('/api/auth/refresh', AuthController::class . '@refresh');
$router->get('/api/auth/me', AuthController::class . '@me');