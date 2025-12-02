<?php

namespace App\Controllers;

use App\Core\RestApi;

class Error
{
    public function notFound()
    {
        RestApi::setHeaders();
        $message = "Trang hoặc endpoint không tồn tại.";
        RestApi::apiError($message, 404);
    }

    public function forbidden()
    {
        RestApi::setHeaders();
        $message = "Bạn không có quyền truy cập vào tài nguyên này.";
        RestApi::apiError($message, 403);
    }

    public function internalServerError()
    {
        RestApi::setHeaders();
        $message = "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.";
        RestApi::apiError($message, 500);
    }
}