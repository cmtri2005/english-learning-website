<?php

namespace App\Middleware;

use App\Core\UserRole;
use App\Core\Cookies;
use App\Core\Helper;

class AuthMiddleware
{
    public static function isLoggedIn(): bool
    {
        $cookies = new Cookies();
        // Use decodeAuth() to validate JWT signature and expiration, not just cookie existence
        $userData = $cookies->decodeAuth();
        return $userData !== null;
    }

    public static function requiredWebAuth(): void
    {
        if (!self::isLoggedIn()) {
            Helper::redirect(Helper::baseUrl('/login'));
        }
    }

    public static function requiredAdmin(): bool
    {
        if (!self::isLoggedIn()) {
            Helper::redirect(Helper::baseUrl('/login'));
        }

        $cookies = new Cookies();
        $user = $cookies->decodeAuth();

        if (!isset($user) || !isset($user['role'])) {
            Helper::redirect(Helper::baseUrl('/login'));
        }

        $role = $user['role'];
        if ($role !== UserRole::ADMIN) {
            Helper::show403("Bạn không có quyền truy cập trang này!");
        }
        return true;
    }

    public static function unAccessStudent(): bool
    {
        if (!self::isLoggedIn()) {
            Helper::redirect(Helper::baseUrl('/login'));
        }

        $cookies = new Cookies();
        $user = $cookies->decodeAuth();
        
        if (!isset($user) || !isset($user['role'])) {
            Helper::redirect(Helper::baseUrl('/login'));
        }

        $role = $user['role'];
        if ($role === UserRole::STUDENT) {
            Helper::show403("Bạn không có quyền truy cập trang này!");
        }
        return true;
    }

    public function redirectIfAuthenticated(): bool
    {
        $cookies = new Cookies();
        $user = $cookies->decodeAuth();

        if (!isset($user)) {
            return true;
        }

        $role = $user['role'] ?? 'student';
        $redirectPath = match ($role) {
            'admin' => Helper::config('defaultSiteAdmin', '/admin/dashboard'),
            'student' => Helper::config('defaultSiteClient', '/')
        };
        
        Helper::redirect(Helper::baseUrl($redirectPath));
        return false;
    }
}