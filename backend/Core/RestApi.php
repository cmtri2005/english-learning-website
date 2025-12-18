<?php

namespace App\Core;
class RestApi
{
    static function setHeaders($isUpload = false)
    {
        // Lấy origin từ request
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        $allowedOrigins = [
            'http://localhost:5173', // Vite dev server
            'http://localhost:3000', // React dev server
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ];

        $corsOrigin = '*'; // Mặc định cho phép tất cả
        // 1. Nếu origin nằm trong whitelist -> dùng origin đó.
        if ($origin && in_array($origin, $allowedOrigins)) {
            $corsOrigin = $origin;
        } elseif ($origin) {
            // Cho phép origin từ request nếu trong development
            $corsOrigin = $origin;
        }

        // Xử lý preflight request (OPTIONS)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header("Access-Control-Allow-Origin: " . $corsOrigin);
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
            header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
            header("Access-Control-Allow-Credentials: true");
            header("Access-Control-Max-Age: 3600");
            http_response_code(200);
            exit();
        }

        // CORS headers cho mọi requests
        header("Access-Control-Allow-Origin: " . $corsOrigin);
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");

        if (!$isUpload) {
            header("Content-Type: application/json; charset=UTF-8");
        } else {
            // set upload file
            header("Content-Type: multipart/form-data");
            header("Accept: application/json");
        }
    }

    static function getBody()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        return $input;
    }

    static function response($data, $status = 200)
    {
        // Xóa output buffer để đảm bảo chỉ có JSON được gửi
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        http_response_code($status);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }

    static function responseError($message, $status = 400)
    {
        $data = [
            'message' => $message,
            'status' => $status,
        ];
        self::response($data, $status);
    }

    static function responseSuccess($metadata, $message = 'Success', $status = 200)
    {
        $data = [
            'message' => $message,
            'status' => $status,
            'metadata' => $metadata
        ];

        self::response($data, $status);
    }

    static function apiResponse($data = null, $message = 'Success', $success = true, $status = 200)
    {
        $response = [
            'success' => $success,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        self::response($response, $status);
    }

    static function apiError($message, $status = 400)
    {
        self::apiResponse(null, $message, false, $status);
    }

    /**
     * Get current authenticated user ID from JWT token
     * @return int|null User ID or null if not authenticated
     */
    static function getCurrentUserId(): ?int
    {
        // Try multiple sources for Authorization header (Apache compatibility)
        $authHeader = null;
        
        // Method 1: Standard HTTP_AUTHORIZATION
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        // Method 2: REDIRECT_HTTP_AUTHORIZATION (Apache mod_rewrite)
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        // Method 3: getallheaders() function
        elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
        }
        // Method 4: apache_request_headers()
        elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
        }

        if ($authHeader && stripos($authHeader, 'Bearer ') === 0) {
            $token = trim(substr($authHeader, 7));
            try {
                $jwt = new JwtHandler($_ENV['JWT_SECRET'] ?? '');
                $payload = $jwt->validateToken($token);
                return $payload['user_id'] ?? null;
            } catch (\Throwable $th) {
                error_log('JWT validation error: ' . $th->getMessage());
                return null;
            }
        }
        return null;
    }

    /**
     * Require authentication - returns user ID or sends 401 error
     * @param string $message Custom error message
     * @return int User ID
     */
    static function requireAuth(string $message = 'Vui lòng đăng nhập'): int
    {
        $userId = self::getCurrentUserId();
        if (!$userId) {
            self::apiError($message, 401);
            exit;
        }
        return $userId;
    }
}
