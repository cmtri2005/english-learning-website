<?php

namespace App\Services;

use App\Core\JwtHandler;
use App\Core\UserRole;
use App\Models\Account;

/**
 * AuthService - Service xử lý logic nghiệp vụ liên quan đến authentication
 * 
 * Tách logic từ AuthController để:
 * - Controller chỉ xử lý HTTP request/response
 * - Service xử lý business logic, có thể tái sử dụng
 */
class AuthService
{
    /**
     * Tạo access token và refresh token cho user
     * 
     * @param Account $user User object
     * @return array ['access' => string, 'refresh' => string]
     */
    public static function generateTokens($user): array
    {
        $jwt = new JwtHandler($_ENV['JWT_SECRET'] ?? '');
        
        // Access token (15 phút)
        $jwt->setExpirationTime(15 * 60);
        $tokenPayload = [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'role' => $user->role
        ];
        $accessToken = $jwt->generateToken($tokenPayload);

        // Refresh token (7 ngày)
        $jwt->setExpirationTime(7 * 24 * 60 * 60);
        $refreshToken = $jwt->generateToken([
            'user_id' => $user->user_id,
            'type' => 'refresh'
        ]);

        return [
            'access' => $accessToken,
            'refresh' => $refreshToken
        ];
    }

    /**
     * Format user data cho frontend
     * 
     * @param Account $user User object
     * @return array Formatted user data
     */
    public static function formatUserData($user): array
    {
        return [
            'id' => $user->user_id,
            'email' => $user->email,
            'name' => $user->name ?? '',
            'avatar' => $user->avatar ?? null,
            'role' => self::mapRoleToFrontend($user->role),
            'email_verified' => empty($user->verify_email_token),
            'created_at' => $user->created_at ?? date('Y-m-d H:i:s')
        ];
    }

    /**
     * Map role từ database sang frontend format
     * 
     * @param string $dbRole Role từ database (user, admin)
     * @return string Role cho frontend (student, admin)
     */
    public static function mapRoleToFrontend($dbRole): string
    {
        $roleMap = [
            UserRole::STUDENT => 'student',  // 'user' in DB -> 'student' in frontend
            UserRole::ADMIN => 'admin'
        ];

        return $roleMap[$dbRole] ?? 'student';
    }
}

