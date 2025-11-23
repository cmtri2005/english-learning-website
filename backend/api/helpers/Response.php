<?php

class Response {
    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($data = null, string $message = 'Success'): void {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], 200);
    }

    public static function error(string $message, int $statusCode = 400, $errors = null): void {
        self::json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Not found'): void {
        self::error($message, 404);
    }

    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }

    public static function validationError(string $message, $errors): void {
        self::error($message, 422, $errors);
    }
}
