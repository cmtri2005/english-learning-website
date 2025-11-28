<?php

class RestApi
{
    static function setHeaders($isUpload = false)
    {
        if (!$isUpload) {
            header("Content-Type: application/json");
            header("Access-Control-Allow-Origin: *");
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
            header("Access-Control-Allow-Headers: Content-Type");
        }

        // set upload file
        header("Content-Type: multipart/form-data");
        header("Aceept: application/json");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");
    }

    static function getBody()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        return $input;
    }

    static function response($data, $status = 200)
    {
        http_response_code(
            $status
        );
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
}
