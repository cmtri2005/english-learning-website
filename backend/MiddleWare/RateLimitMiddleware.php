<?php

namespace App\Middleware;

use App\Core\RestApi;

class RateLimitMiddleware
{
    private static string $storagePath = '/tmp/rate_limits/';

    public static function attempt(
        string $action, // 'login', 'register' 
        ?string $identifier = null,
        int $maxAttempts = 5,
        int $decayMinutes = 1
    ): bool {
        $identifier = $identifier ?: self::getClientIp();
        $key = self::getKey($action, $identifier);

        // 1. Lấy dữ liệu hiện tại
        $data = self::getData($key);

        // 2. Reset nếu đã hết thời gian 
        $now = time();
        if ($data['reset_at'] < $now) {
            $data = [
                'attempts' => 0,
                'reset_at' => $now + ($decayMinutes * 60)
            ];
        }

        // 3. Kiểm tra limit
        if ($data['attempts'] >= $maxAttempts) {
            return false;
        }

        // 4. Tăng số lần attempt và lưu
        $data['attempts']++;
        self::setData($key, $data);

        return true;
    }

    public static function check(
        string $action,
        ?string $identifier = null,
        int $maxAttempts = 5,
        int $decayMinutes = 1
    ): bool {
        if (!self::attempt($action, $identifier, $maxAttempts, $decayMinutes)) {
            $remaining = self::getRemainingTime($action, $identifier);
            RestApi::apiError(
                "Quá nhiều yêu cầu. Vui lòng thử lại sau {$remaining} giây.",
                429
            );
            return true; // Dừng request
        }
        return false; // Tiếp tục request
    }

    public static function getRemainingAttempts(
        string $action,
        ?string $identifier = null,
        int $maxAttempts = 5
    ): int {
        $identifier = $identifier ?: self::getClientIp();
        $key = self::getKey($action, $identifier);
        $data = self::getData($key);

        if ($data['reset_at'] < time()) {
            return $maxAttempts;
        }

        return max(0, $maxAttempts - $data['attempts']);
    }

    public static function getRemainingTime(string $action, ?string $identifier = null): int
    {
        $identifier = $identifier ?: self::getClientIp();
        $key = self::getKey($action, $identifier);
        $data = self::getData($key);

        return max(0, $data['reset_at'] - time());
    }

    public static function reset(string $action, ?string $identifier = null): void
    {
        $identifier = $identifier ?: self::getClientIp();
        $key = self::getKey($action, $identifier);
        $file = self::getFilePath($key);

        if (file_exists($file)) {
            unlink($file);
        }
    }

    private static function getClientIp(): string
    {
        // Ưu tiên các header proxy phổ biến
        $headers = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }

    private static function getKey(string $action, string $identifier): string
    {
        return md5("{$action}:{$identifier}");
    }

    private static function getFilePath(string $key): string
    {
        // Đảm bảo thư mục tồn tại
        if (!is_dir(self::$storagePath)) {
            mkdir(self::$storagePath, 0755, true);
        }
        return self::$storagePath . $key . '.json';
    }

    private static function getData(string $key): array
    {
        $file = self::getFilePath($key);

        if (file_exists($file)) {
            $content = file_get_contents($file);
            $data = json_decode($content, true);
            if ($data && isset($data['attempts']) && isset($data['reset_at'])) {
                return $data;
            }
        }

        return [
            'attempts' => 0,
            'reset_at' => time() + 60
        ];
    }

    private static function setData(string $key, array $data): void
    {
        $file = self::getFilePath($key);
        file_put_contents($file, json_encode($data), LOCK_EX);
    }

    public static function checkLogin(?string $email = null): bool
    {
        return self::check('login', $email, 5, 1);
    }

    public static function checkRegister(): bool
    {
        return self::check('register', null, 3, 1);
    }

    public static function checkForgotPassword(?string $email = null): bool
    {
        return self::check('forgot_password', $email, 3, 1);
    }

    public static function checkOtpVerify(?string $email = null): bool
    {
        return self::check('otp_verify', $email, 5, 1);
    }

    public static function checkOtpResend(?string $email = null): bool
    {
        return self::check('otp_resend', $email, 2, 1);
    }
}

