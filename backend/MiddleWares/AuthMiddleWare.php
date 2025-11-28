<?php

namespace App\MiddleWares;

use App\Core\UserRole;
use App\Core\Cookies;

class AuthMiddeWare
{
    public static function isLoggedIn()
    {
        $cookies = new Cookies();
        $isLoggedIn = $cookies->getAuth();
        return isset($isLoggedIn) ? true : false;
    }

    public static function requiredWebAuth()
    {
        if (!self::isLoggedIn()) {
            redirect(base_url('/login'));
        }
    }

    public static function requiredAdmin()
    {
        if (!self::isLoggedIn()) {
            redirect(base_url('/login'));
        }

        $cookies = new Cookies();
        $user = $cookies->decodeAuth();

        $role = $user['role'];
        if ($role !== UserRole::ADMIN) {
            show_403("Bạn không có quyền truy cập trang này!");
        }
        return true;
    }

    public static function unAccessStudent()
    {
        if (!self::isLoggedIn()) {
            redirect(base_url('/login'));
        }

        $cookies = new Cookies();
        $user = $cookies->decodeAuth();
        $role = $user['role'];
        if ($role === UserRole::STUDENT) {
            show_403("Bạn không có quyền truy cập trang này!");
        }
        return true;
    }
    public function redirectIfAuthenticated()
    {
        $cookies = new Cookies();
        $user = $cookies->deocdeAuth();

        if (!isset($user)) {
            return true;
        }

        $role = $user['role'];

        $redirectPath = match ($role) {
            'admin' => Configs('defaultSiteAdmin'),
            'student' => Configs('defaultSiteClient')
        };
        redirect(base_url($redirectPath));
    }
}