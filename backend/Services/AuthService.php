<?php

namespace App\Services;

use App\Core\JwtHandler;
use App\Core\UserRole;
use App\Models\Account;

class AuthService
{
    public static function generateTokens($user): array
    {
        $jwt = new JwtHandler($_ENV['JWT_SECRET'] ?? '');
        
        // Access token - 15 minutes
        $jwt->setExpirationTime(15 * 60);
        
        // Payload
        $tokenPayload = [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'role' => $user->role
        ];
        $accessToken = $jwt->generateToken($tokenPayload);

        // Refresh token - 7 days
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

    public static function mapRoleToFrontend($dbRole): string
    {
        $roleMap = [
            UserRole::STUDENT => 'student',
            UserRole::ADMIN => 'admin'
        ];

        return $roleMap[$dbRole] ?? 'student';
    }
}

