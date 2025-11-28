<?php

namespace App\Core;

use Exception;

class Cookies
{
    private $cookie_name = "session_token";
    private const COOKIE_EXPIRE = 60 * 60 * 24 * 7;

    public function setAuth($payload)
    {
        $jwt = new JwtHandler($_ENV['JWT_SECRET']);
        $expired = time() + self::COOKIE_EXPIRE;

        $jwt->setExpirationTime($expired);
        $encryptPayload = $jwt->generateToken($payload);
        $cookieOptions = [
            'expires' => $expired,
            'path' => '/',
            'domain' => '',
            'secure' => false, // Set to true in production with HTTPS
            'httponly' => true, // Prevent XSS
            'samesite' => 'Lax' // CRSF protection
        ];

        // create cookie
        setcookie(
            $this->cookie_name,
            $encryptPayload,
            $cookieOptions['expires'],
            $cookieOptions['path'],
            $cookieOptions['domain'],
            $cookieOptions['secure'],
            $cookieOptions['httponly'],
        );
    }

    public function getAuth()
    {
        return isset($_COOKIE[$this->cookie_name]) ? $_COOKIE[$this->cookie_name] : null;
    }

    public function removeAuth()
    {
        unset($_COOKIE[$this->cookie_name]);
        setcookie(
            $this->cookie_name,
            '',
            time() - 3600, // Set to a past time to expire the cookie
            '/'
        );
    }

    public function decodeAuth()
    {
        try {
            $token = $this->getAuth();

            if (!$token) {
                return null;
            }

            $jwt = new JwtHandler($_ENV['JWT_SECRET']);
            $decryptPayload = $jwt->decodeToken($token);

            return $decryptPayload['payload']['data'];
        } catch (\Throwable $th) {
            $this->removeAuth();
            return null;
        }
    }

    public function updateAuth($userData, $keepExpirationTime = true)
    {
        try {
            $currentToken = $this->getAuth();

            if (!$currentToken) {
                $this->setAuth($userData);
                return true;
            }

            $jwt = new JwtHandler($_ENV['JWT_SECRET']);

            $currentPayload = $jwt->decodeToken($currentToken);

            if (!$currentPayload || !isset($currentPayload['payload'])) {
                // Token không hợp lệ, tạo mới
                $this->setAuth($userData);
                return true;
            }

            $existingData = isset($currentPayload['payload']['data'])
                ? $currentPayload['payload']['data']
                : [];

            $updatedData = array_merge($existingData, $userData);

            // Xác định thời gian hết hạn
            if ($keepExpirationTime && isset($currentPayload['payload']['exp'])) {
                // Giữ nguyên thời gian hết hạn hiện tại
                $expirationTime = $currentPayload['payload']['exp'] - time();

                // Nếu token đã hết hạn hoặc sắp hết hạn (< 1 giờ), tạo token mới với thời gian đầy đủ
                if ($expirationTime <= 3600) {
                    $expirationTime = self::COOKIE_EXPIRE;
                }
            } else {
                // Tạo token mới với thời gian đầy đủ
                $expirationTime = self::COOKIE_EXPIRE;
            }

            // Tạo JWT mới với dữ liệu đã cập nhật
            $jwt->setExpirationTime($expirationTime);
            $newToken = $jwt->generateToken(['data' => $updatedData]);

            // Cập nhật cookie
            $cookieExpire = time() + $expirationTime;
            $cookieOptions = [
                'expires' => $cookieExpire,
                'path' => '/',
                'domain' => '',
                'secure' => false, // Set to true in production with HTTPS
                'httponly' => true, // Prevent XSS
                'samesite' => 'Lax' // CSRF protection
            ];

            setcookie(
                $this->cookie_name,
                $newToken,
                $cookieOptions['expires'],
                $cookieOptions['path'],
                $cookieOptions['domain'],
                $cookieOptions['secure'],
                $cookieOptions['httponly']
            );

            // Cập nhật $_COOKIE superglobal để có thể sử dụng ngay lập tức
            $_COOKIE[$this->cookie_name] = $newToken;

            return true;
        } catch (Exception $e) {
            error_log('Update auth cookie error: ' . $e->getMessage());

            // Nếu có lỗi, thử tạo cookie mới
            try {
                $this->removeAuth();
                $this->setAuth($userData);
                return true;
            } catch (Exception $e2) {
                error_log('Fallback create auth cookie error: ' . $e2->getMessage());
                return false;
            }
        }
    }

    public function refreshAuth()
    {
        try {
            $currentData = $this->decodeAuth();

            if (!$currentData) {
                return false;
            }

            // Cập nhật với dữ liệu hiện tại nhưng thời gian hết hạn mới
            return $this->updateAuth($currentData, false);
        } catch (Exception $e) {
            error_log('Refresh auth cookie error: ' . $e->getMessage());
            return false;
        }
    }
    public function getTokenRemainingTime()
    {
        try {
            $token = $this->getAuth();

            if (!$token) {
                return 0;
            }

            $jwt = new JwtHandler($_ENV['JWT_SECRET']);
            return $jwt->getTokenRemainingTime($token);
        } catch (Exception $e) {
            return 0;
        }
    }

    public function isTokenExpiringSoon()
    {
        return $this->getTokenRemainingTime() < 3600;
    }
}
