<?php

namespace App\Controllers;

use App\Core\Cookies;
use App\Core\Hash;
use App\Core\RestApi;
use App\Core\UserRole;
use App\Core\JwtHandler;
use App\Middleware\AuthMiddleware;
use App\Models\Account;
use App\Helper\MailHelper;
use App\Services\AuthService;
use Exception;

class AuthController
{
    public function login() {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            // Validation
            $email = isset($body['email']) ? trim($body['email']) : '';
            $password = $body['password'] ?? '';

            if (empty($email) || empty($password)) {
                RestApi::apiError('Email và mật khẩu không được để trống', 400);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                RestApi::apiError('Email không hợp lệ', 400);
                return;
            }

            // Tìm user
            $user = Account::findByEmail($email);

            // Security: Không tiết lộ email có tồn tại hay không
            // Luôn trả về cùng message để tránh user enumeration
            if (!isset($user) || !Hash::check($password, $user->password)) {
                RestApi::apiError('Email hoặc mật khẩu không chính xác', 401);
                return;
            }

            // Tạo tokens và response
            $tokens = AuthService::generateTokens($user);
            $userData = AuthService::formatUserData($user);
            
            $cookies = new Cookies();
            $cookies->setAuth([
                'user_id' => $user->user_id,
                'email' => $user->email,
                'role' => $user->role
            ]);

            RestApi::apiResponse([
                'user' => $userData,
                'token' => $tokens['access'],
                'refreshToken' => $tokens['refresh']
            ], 'Đăng nhập thành công', true, 200);

        } catch (Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            error_log('File: ' . $e->getFile() . ':' . $e->getLine());
            
            // Clean output buffer
            if (ob_get_level() > 0) {
                ob_clean();
            }
            
            RestApi::apiError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.', 500);
        }
    }


    public function register() {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            // Validation
            $email = isset($body['email']) ? trim($body['email']) : '';
            $password = $body['password'] ?? '';
            $confirmPassword = $body['confirmPassword'] ?? '';
            $name = isset($body['name']) ? trim($body['name']) : '';

            if (empty($email) || empty($password) || empty($confirmPassword)) {
                RestApi::apiError('Email, mật khẩu và mật khẩu xác nhận không được để trống', 400);
                return;
            }

            if (empty($name)) {
                RestApi::apiError('Tên không được để trống', 400);
                return;
            }

            if (strlen($name) < 2) {
                RestApi::apiError('Tên phải có ít nhất 2 ký tự', 400);
                return;
            }

            if (strlen($name) > 100) {
                RestApi::apiError('Tên không được vượt quá 100 ký tự', 400);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                RestApi::apiError('Email không hợp lệ', 400);
                return;
            }

            if ($password !== $confirmPassword) {
                RestApi::apiError('Mật khẩu và mật khẩu xác nhận không khớp', 400);
                return;
            }

            if (strlen($password) < 8) {
                RestApi::apiError('Mật khẩu phải có ít nhất 8 ký tự', 400);
                return;
            }

            // Validate password strength (ít nhất 1 chữ cái và 1 số)
            if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
                RestApi::apiError('Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số', 400);
                return;
            }

            // Kiểm tra email đã tồn tại
            if (Account::findByEmail($email)) {
                RestApi::apiError('Email đã tồn tại', 400);
                return;
            }

            // Tạo user
            $user = Account::create([
                'email' => $email,
                'password' => Hash::make($password),
                'name' => $name,
                'role' => UserRole::STUDENT
            ]);

            if (!$user) {
                RestApi::apiError('Không thể tạo tài khoản. Vui lòng thử lại sau.', 500);
                return;
            }

            // Tạo tokens và response
            $tokens = AuthService::generateTokens($user);
            $userData = AuthService::formatUserData($user);
            
            $cookies = new Cookies();
            $cookies->setAuth([
                'user_id' => $user->user_id,
                'email' => $user->email,
                'role' => $user->role
            ]);

            RestApi::apiResponse([
                'user' => $userData,
                'token' => $tokens['access'],
                'refreshToken' => $tokens['refresh']
            ], 'Đăng ký thành công', true, 200);

        } catch (Exception $e) {
            error_log('Register error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.', 500);
        }
    }

    /**
     * Hiển thị thông tin endpoint quên mật khẩu (dùng cho backend hoặc debug)
     * Frontend SPA sẽ dùng POST /forgot-password.
     */
    public function showForgotPassword()
    {
        try {
            RestApi::setHeaders();
            RestApi::apiResponse(
                null,
                'Forgot password endpoint. Gửi POST với email để nhận hướng dẫn đặt lại mật khẩu.',
                true,
                200
            );
        } catch (Exception $e) {
            error_log('Show forgot password error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi xử lý request.', 500);
        }
    }

    /**
     * Xử lý yêu cầu quên mật khẩu:
     * - Nhận email
     * - Nếu email tồn tại: tạo reset_password_token + reset_password_expires_at
     * - (Tùy chọn) Gửi email chứa link/mã đặt lại mật khẩu
     * - Luôn trả về message chung để tránh lộ email tồn tại hay không
     */
    public function forgotPassword()
    {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            $email = isset($body['email']) ? trim($body['email']) : '';

            if (empty($email)) {
                RestApi::apiError('Email không được để trống', 400);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                RestApi::apiError('Email không hợp lệ', 400);
                return;
            }

            // Tìm user theo email (có thể null)
            $user = Account::findByEmail($email);
            if (!isset($user)) {
                RestApi::apiError('Email không tồn tại trong hệ thống', 404);
                return;
            }
            $newPassword = self::generateRandomPassword(12);
            $hashedPassword = Hash::make($newPassword);
            $user->updatePassword($hashedPassword);
            
            // Xóa token reset cũ (nếu có)
            $user->clearResetPasswordToken();

            $emailSent = MailHelper::sendPasswordResetEmail($email, $newPassword, $user->name ?? '');

            if (!$emailSent) {
                error_log("WARNING: Failed to send password reset email to {$email}");
                error_log("New password (for dev/testing): {$newPassword}");
                error_log("Password has been updated in database for user: {$email}");
                
                // Kiểm tra xem có phải môi trường production không
                $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
                
                if ($isProduction) {
                    RestApi::apiError('Đã tạo mật khẩu mới nhưng không thể gửi email. Vui lòng liên hệ admin.', 500);
                    return;
                } else {
                    RestApi::apiResponse(
                        [
                            'newPassword' => $newPassword
                        ],
                        'Mật khẩu mới đã được tạo và cập nhật vào database. Vui lòng kiểm tra logs để lấy mật khẩu (môi trường dev).',
                        true,
                        200
                    );
                    return;
                }
            }

            error_log("New password email sent successfully to {$email}");
            error_log("Password has been updated in database for user: {$email}");

            // Trả về success khi email đã được gửi
            RestApi::apiResponse(
                null,
                'Chúng tôi đã gửi mật khẩu mới vào hộp thư của bạn. Vui lòng kiểm tra email và đăng nhập với mật khẩu mới.',
                true,
                200
            );
        } catch (Exception $e) {
            error_log('Forgot password error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi xử lý request', 500);
        }
    }

    /**
     * Hiển thị endpoint đặt lại mật khẩu (debug/backend).
     * Frontend SPA sẽ xử lý giao diện, nên GET chỉ trả về message.
     */
    public function showResetPassword()
    {
        try {
            RestApi::setHeaders();
            RestApi::apiResponse(
                null,
                'Reset password endpoint. Gửi POST với token, password, confirmPassword để đặt lại mật khẩu.',
                true,
                200
            );
        } catch (Exception $e) {
            error_log('Show reset password error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi xử lý request.', 500);
        }
    }

    /**
     * Đặt lại mật khẩu với token:
     * - Nhận token, password, confirmPassword
     * - Validate token, kiểm tra hạn sử dụng
     * - Hash & cập nhật mật khẩu mới
     * - Xóa token reset
     */
    public function resetPassword()
    {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            $token = $body['token'] ?? '';
            $password = $body['password'] ?? '';
            $confirmPassword = $body['confirmPassword'] ?? '';

            if (empty($token)) {
                RestApi::apiError('Token đặt lại mật khẩu không được để trống', 400);
                return;
            }

            if (empty($password) || empty($confirmPassword)) {
                RestApi::apiError('Mật khẩu mới không được để trống', 400);
                return;
            }

            if ($password !== $confirmPassword) {
                RestApi::apiError('Mật khẩu xác nhận không khớp', 400);
                return;
            }

            if (strlen($password) < 8) {
                RestApi::apiError('Mật khẩu phải có ít nhất 8 ký tự', 400);
                return;
            }

            // Tìm user theo token
            $user = Account::findByResetToken($token);

            if (!isset($user)) {
                RestApi::apiError('Token không hợp lệ hoặc đã được sử dụng', 400);
                return;
            }

            // Kiểm tra hạn sử dụng
            if (!empty($user->reset_password_expires_at)) {
                $now = time();
                $expiresAt = strtotime($user->reset_password_expires_at);

                if ($expiresAt < $now) {
                    RestApi::apiError('Token đặt lại mật khẩu đã hết hạn', 400);
                    return;
                }
            }

            // Hash mật khẩu mới
            $hashedPassword = Hash::make($password);

            // Cập nhật mật khẩu & xóa token reset
            $user->updatePassword($hashedPassword);
            $user->clearResetPasswordToken();

            RestApi::apiResponse(
                null,
                'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
                true,
                200
            );
        } catch (Exception $e) {
            error_log('Reset password error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi đặt lại mật khẩu.', 500);
        }
    }

    public function logout() {
        try {
            RestApi::setHeaders();
            
            $cookies = new Cookies();
            $cookies->removeAuth();

            RestApi::apiResponse(null, 'Đăng xuất thành công', true, 200);
        } catch (Exception $e) {
            error_log('Logout error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.', 500);
        }
    }

    /**
     * Refresh access token bằng refresh token
     */
    public function refresh() {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            $refreshToken = $body['refreshToken'] ?? null;

            if (empty($refreshToken)) {
                RestApi::apiError('Refresh token không được để trống', 400);
                return;
            }

            $jwt = new JwtHandler($_ENV['JWT_SECRET'] ?? '');
            
            try {
                // Validate refresh token
                $payload = $jwt->validateToken($refreshToken);
                
                // Kiểm tra đây có phải refresh token không
                if (!isset($payload['type']) || $payload['type'] !== 'refresh') {
                    RestApi::apiError('Token không hợp lệ', 401);
                    return;
                }

                // Lấy user từ refresh token
                $userId = $payload['user_id'] ?? null;
                if (!$userId) {
                    RestApi::apiError('Token không hợp lệ', 401);
                    return;
                }

                $user = Account::find($userId);
                if (!isset($user)) {
                    RestApi::apiError('Người dùng không tồn tại', 404);
                    return;
                }

                // Tạo tokens mới
                $tokens = AuthService::generateTokens($user);
                $userData = AuthService::formatUserData($user);

                // Cập nhật cookie
                $cookies = new Cookies();
                $cookies->setAuth([
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'role' => $user->role
                ]);

                RestApi::apiResponse([
                    'user' => $userData,
                    'token' => $tokens['access'],
                    'refreshToken' => $tokens['refresh']
                ], 'Làm mới token thành công', true, 200);

            } catch (Exception $e) {
                RestApi::apiError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
                return;
            }

        } catch (Exception $e) {
            error_log('Refresh token error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            error_log('File: ' . $e->getFile() . ':' . $e->getLine());
            
            // Clean output buffer
            if (ob_get_level() > 0) {
                ob_clean();
            }
            
            RestApi::apiError('Đã xảy ra lỗi khi làm mới token. Vui lòng thử lại sau.', 500);
        }
    }

    /**
     * Lấy thông tin user hiện tại
     */
    public function me() {
        try {
            RestApi::setHeaders();
            
            $cookies = new Cookies();
            $userData = $cookies->decodeAuth();

            if (!isset($userData) || !isset($userData['user_id'])) {
                RestApi::apiError('Chưa đăng nhập', 401);
                return;
            }

            $user = Account::find($userData['user_id']);
            if (!isset($user)) {
                RestApi::apiError('Người dùng không tồn tại', 404);
                return;
            }

            $formattedUser = AuthService::formatUserData($user);
            // Frontend expect ApiResponse<User>, không bọc thêm 'user'
            RestApi::apiResponse($formattedUser, 'Lấy thông tin thành công', true, 200);

        } catch (Exception $e) {
            error_log('Get current user error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            error_log('File: ' . $e->getFile() . ':' . $e->getLine());
            
            // Clean output buffer
            if (ob_get_level() > 0) {
                ob_clean();
            }
            
            RestApi::apiError('Đã xảy ra lỗi khi lấy thông tin người dùng.', 500);
        }
    }

    /**
     * Tạo mật khẩu ngẫu nhiên
     * 
     * @param int $length Độ dài mật khẩu (mặc định 12)
     * @return string Mật khẩu ngẫu nhiên
     */
    private static function generateRandomPassword($length = 12): string
    {
        // Ký tự cho mật khẩu: chữ hoa, chữ thường, số
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        $allChars = $uppercase . $lowercase . $numbers;
        
        $password = '';
        
        // Đảm bảo có ít nhất 1 chữ hoa, 1 chữ thường, 1 số
        $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];
        
        // Thêm các ký tự ngẫu nhiên còn lại
        for ($i = strlen($password); $i < $length; $i++) {
            $password .= $allChars[random_int(0, strlen($allChars) - 1)];
        }
        
        // Xáo trộn mật khẩu để không dự đoán được vị trí
        return str_shuffle($password);
    }
}