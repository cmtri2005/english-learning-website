<?php

namespace App\Core;

/**
 * Session management class
 * Gộp cả flash message functions
 */
class Session
{
    public static function set(string $key, $value): void
    {
        $_SESSION[$key] = $value;
    }

    public static function get(string $key, $default = null)
    {
        return $_SESSION[$key] ?? $default;
    }

    public static function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }

    public static function destroy(): void
    {
        session_destroy();
    }

    /**
     * Set flash message (lưu message để hiển thị 1 lần)
     */
    public static function setFlash(string $key, $value): void
    {
        $_SESSION[$key] = $value;
    }

    /**
     * Get flash message (lấy và xóa sau khi lấy)
     */
    public static function getFlash(string $key, $default = null)
    {
        $message = $_SESSION[$key] ?? $default;
        if (isset($_SESSION[$key])) {
            unset($_SESSION[$key]);
        }
        return $message;
    }
}
