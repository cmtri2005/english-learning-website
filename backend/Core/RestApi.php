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
}
