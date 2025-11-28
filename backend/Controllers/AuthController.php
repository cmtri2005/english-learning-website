<?php

namespace App\Controller\Auth;

use App\Core\Cookies;
use App\Core\Hash;
use App\Core\RestApi;
use App\Core\Mail;
use App\Core\UserRole;
use App\Middlewares\AuthMiddleWare;
use App\Models\Account;
use Exception;

class AuthController
{
    public function showLogin()
    {
        $auth = new AuthMiddleWare();
        $auth->redirectIfAuthenticated();
        render_view('auth/login', [], 'auth');
    }

    public function login() {
        RestApi::setHeaders();

        $body = RestApi::getBody();

        $email = $body['email'];
        $password = $body['password'];

        $user = Account::findByEmail($email);

        if (!isset($user)) {
            RestApi::responseError('Email không tồn tại');
        }

        if (!Hash::check($password, $user->password)) {
            RestApi::responseError('Mật khẩu không chính xác');
        }

        unset($user->password);
        $cookies = new Cookies();
        $cookies->SetAuth($user);

        RestApi::responseSuccess($user, 'Đăng nhập thành công');
    }

    
}