<?php

namespace App\Core;

use App\Helper\Database;

/**
 * Helper class chứa các utility functions dùng chung
 * Tất cả methods đều là static để dễ sử dụng
 */
class Helper
{
    /**
     * Lấy PDO connection từ Database singleton
     */
    public static function PDO(): \PDO
    {
        return Database::getInstance();
    }

    /**
     * Tạo base URL
     */
    public static function baseUrl(string $url = ''): string
    {
        return ($_ENV['BASE_URL'] ?? '') . $url;
    }

    /**
     * Redirect đến URL
     */
    public static function redirect(string $url): void
    {
        header('Location: ' . $url);
        exit();
    }

    /**
     * Hiển thị 403 error
     */
    public static function show403(?string $message = null): void
    {
        if ($message) {
            Session::setFlash('error_message', $message);
        }
        http_response_code(403);
    }

    /**
     * Lấy config value
     */
    public static function config(string $key, $default = null)
    {
        static $configs = null;
        if ($configs === null) {
            $configPath = __DIR__ . '/../utils/configs.php';
            $configs = file_exists($configPath) ? require $configPath : [];
        }
        return $configs[$key] ?? $default;
    }
}

