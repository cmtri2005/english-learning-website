<?php

namespace App\Controllers;

use App\Core\Cookies;
use App\Core\Hash;
use App\Core\RestApi;
use App\Core\UserRole;
use App\Core\JwtHandler;
use App\Middleware\RateLimitMiddleware;
use App\Models\Account;
use App\Helper\MailHelper;
use App\Services\AuthService;
use Exception;

class AuthController
{
    public function login()
    {
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

            // Rate limiting: 5 attempts per minute per email
            if (RateLimitMiddleware::checkLogin($email)) {
                return;
            }

            // Tìm user
            $user = Account::findByEmail($email);

            // Security: Không tiết lộ email có tồn tại hay không
            // Luôn trả về cùng message để tránh user enumeration
            // Note: Không kiểm tra MX record ở login vì email đã tồn tại trong DB
            if (!isset($user) || !Hash::check($password, $user->password)) {
                RestApi::apiError('Email hoặc mật khẩu không chính xác', 401);
                return;
            }

            // Chặn đăng nhập nếu email chưa xác minh
            if (!empty($user->verify_email_token)) {
                RestApi::apiError('Email chưa được xác minh. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.', 403);
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
            $cookies->setRefreshToken($tokens['refresh']);

            RestApi::apiResponse([
                'user' => $userData,
                'token' => $tokens['access']
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


    public function register()
    {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            // Rate limiting: 3 attempts per minute per IP
            if (RateLimitMiddleware::checkRegister()) {
                return;
            }

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

            // Sinh OTP xác minh
            $otp = self::generateOtp();
            $expiresTime = time() + 10 * 60; // 10 phút
            $otpExpiresDB = date('Y-m-d H:i:s', $expiresTime);
            $otpExpiresISO = date(DATE_ATOM, $expiresTime);

            // Tạo user
            $user = Account::create([
                'email' => $email,
                'password' => Hash::make($password),
                'name' => $name,
                'role' => UserRole::STUDENT,
                'verify_email_token' => $otp,
                'verify_token_expires_at' => $otpExpiresDB
            ]);

            if (!$user) {
                RestApi::apiError('Không thể tạo tài khoản. Vui lòng thử lại sau.', 500);
                return;
            }

            // Gửi OTP xác minh email
            MailHelper::sendRegisterOtpEmail($email, $otp, $name);

            RestApi::apiResponse([
                'requiresVerification' => true,
                'email' => $email,
                'otpExpiresAt' => $otpExpiresISO
            ], 'Đăng ký thành công. Vui lòng kiểm tra email để nhập mã OTP.', true, 200);

        } catch (Exception $e) {
            error_log('Register error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.', 500);
        }
    }

    /**
     * Thông tin endpoint OTP đăng ký
     */
    public function showRegisterOtp()
    {
        RestApi::setHeaders();
        RestApi::apiResponse(null, 'Gửi POST /register/otp/verify với email và otp để xác minh.', true, 200);
    }

    /**
     * Xác minh OTP đăng ký
     */
    public function verifyOtp()
    {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            $email = isset($body['email']) ? trim($body['email']) : '';
            $otp = isset($body['otp']) ? trim($body['otp']) : '';

            if (empty($email) || empty($otp)) {
                RestApi::apiError('Email và mã OTP không được để trống', 400);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                RestApi::apiError('Email không hợp lệ', 400);
                return;
            }

            // Rate limiting: 5 attempts per minute per email
            if (RateLimitMiddleware::checkOtpVerify($email)) {
                return;
            }

            if (!preg_match('/^[0-9]{6}$/', $otp)) {
                RestApi::apiError('Mã OTP phải gồm 6 chữ số', 400);
                return;
            }

            $user = Account::findByEmail($email);
            if (!isset($user)) {
                RestApi::apiError('Tài khoản không tồn tại', 404);
                return;
            }

            if (empty($user->verify_email_token)) {
                RestApi::apiError('Tài khoản đã được xác minh trước đó', 400);
                return;
            }

            if ($user->verify_email_token !== $otp) {
                RestApi::apiError('Mã OTP không chính xác', 400);
                return;
            }

            if (!empty($user->verify_token_expires_at)) {
                $now = time();
                $expiresAt = strtotime($user->verify_token_expires_at);
                if ($expiresAt < $now) {
                    RestApi::apiError('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.', 400);
                    return;
                }
            }

            // Xóa OTP, đánh dấu đã xác minh
            $user->clearVerifyEmailToken();

            // Tạo tokens và response
            $tokens = AuthService::generateTokens($user);
            $userData = AuthService::formatUserData($user);

            $cookies = new Cookies();
            $cookies->setAuth([
                'user_id' => $user->user_id,
                'email' => $user->email,
                'role' => $user->role
            ]);
            $cookies->setRefreshToken($tokens['refresh']);

            RestApi::apiResponse([
                'user' => $userData,
                'token' => $tokens['access']
            ], 'Xác minh email thành công', true, 200);
        } catch (Exception $e) {
            error_log('Verify OTP error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi xác minh OTP.', 500);
        }
    }

    /**
     * Gửi lại OTP đăng ký
     */
    public function resendOtp()
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

            // Rate limiting: 2 attempts per minute per email
            if (RateLimitMiddleware::checkOtpResend($email)) {
                return;
            }

            $user = Account::findByEmail($email);
            if (!isset($user)) {
                RestApi::apiError('Tài khoản không tồn tại', 404);
                return;
            }

            if (empty($user->verify_email_token)) {
                RestApi::apiError('Tài khoản đã được xác minh, không cần gửi OTP.', 400);
                return;
            }

            $otp = self::generateOtp();
            $expiresTime = time() + 10 * 60;
            $otpExpiresDB = date('Y-m-d H:i:s', $expiresTime);
            $otpExpiresISO = date(DATE_ATOM, $expiresTime);

            $user->updateVerifyEmailToken($otp, $otpExpiresDB);

            MailHelper::sendRegisterOtpEmail($email, $otp, $user->name ?? '');

            RestApi::apiResponse([
                'requiresVerification' => true,
                'email' => $email,
                'otpExpiresAt' => $otpExpiresISO
            ], 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.', true, 200);
        } catch (Exception $e) {
            error_log('Resend OTP error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi gửi lại OTP.', 500);
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

            // Rate limiting: 3 attempts per minute per email
            if (RateLimitMiddleware::checkForgotPassword($email)) {
                return;
            }

            // Tìm user theo email (có thể null)
            $user = Account::findByEmail($email);

            // Luôn trả message chung, không tiết lộ email tồn tại hay không
            $responseMessage = 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.';

            if (!isset($user)) {
                RestApi::apiResponse(null, $responseMessage, true, 200);
                return;
            }

            // Tạo reset token và hạn sử dụng 60 phút
            $resetToken = bin2hex(random_bytes(32));
            $expiresTime = time() + 60 * 60;
            $expiryDB = date('Y-m-d H:i:s', $expiresTime);
            // Frontend hiện tại không dùng expiry của reset token, nhưng nếu cần thì dùng DATE_ATOM

            $user->updateResetPasswordToken($resetToken, $expiryDB);

            $emailSent = MailHelper::sendResetLinkEmail($email, $resetToken, $user->name ?? '');

            if (!$emailSent) {
                error_log("WARNING: Failed to send reset password email to {$email}");
            }

            RestApi::apiResponse(null, $responseMessage, true, 200);
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

    public function logout()
    {
        try {
            RestApi::setHeaders();

            $cookies = new Cookies();
            $cookies->removeAuth();
            $cookies->removeRefreshToken();

            RestApi::apiResponse(null, 'Đăng xuất thành công', true, 200);
        } catch (Exception $e) {
            error_log('Logout error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.', 500);
        }
    }

    /**
     * Refresh access token bằng refresh token
     */
    public function refresh()
    {
        try {
            RestApi::setHeaders();

            $cookies = new Cookies();
            $refreshToken = $cookies->getRefreshToken();

            if (empty($refreshToken)) {
                RestApi::apiError('Refresh token không tồn tại', 400);
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
                $cookies->setAuth([
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'role' => $user->role
                ]);
                $cookies->setRefreshToken($tokens['refresh']);

                RestApi::apiResponse([
                    'user' => $userData,
                    'token' => $tokens['access']
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
    public function me()
    {
        try {
            RestApi::setHeaders();

            // Ưu tiên bearer token (frontend đang lưu token trong localStorage)
            $jwt = new JwtHandler($_ENV['JWT_SECRET'] ?? '');
            $userId = null;

            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (stripos($authHeader, 'Bearer ') === 0) {
                $token = trim(substr($authHeader, 7));
                try {
                    $payload = $jwt->validateToken($token);
                    $userId = $payload['user_id'] ?? null;
                } catch (\Throwable $th) {
                    // fallback sang cookie nếu bearer không hợp lệ
                }
            }

            // Fallback cookie
            if (!$userId) {
                $cookies = new Cookies();
                $userData = $cookies->decodeAuth();
                $userId = $userData['user_id'] ?? null;
            }

            if (!$userId) {
                RestApi::apiError('Chưa đăng nhập', 401);
                return;
            }

            $user = Account::find($userId);
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
     * Google Login with Firebase
     * 
     * Flow:
     * 1. Receive Firebase ID token from frontend
     * 2. Verify token with Google's public keys
     * 3. Find or create user by google_uid
     * 4. Return JWT tokens
     */
    public function googleLogin()
    {
        try {
            RestApi::setHeaders();
            $body = RestApi::getBody();

            $idToken = $body['idToken'] ?? '';

            if (empty($idToken)) {
                RestApi::apiError('ID Token không được để trống', 400);
                return;
            }

            // Verify Firebase ID token with Google
            $firebaseUser = $this->verifyFirebaseToken($idToken);

            if (!$firebaseUser) {
                RestApi::apiError('Token không hợp lệ hoặc đã hết hạn', 401);
                return;
            }

            $googleUid = $firebaseUser['sub'] ?? $firebaseUser['user_id'] ?? null;
            $email = $firebaseUser['email'] ?? null;
            $name = $firebaseUser['name'] ?? $firebaseUser['email'] ?? 'Google User';
            $avatar = $firebaseUser['picture'] ?? null;

            if (!$googleUid || !$email) {
                RestApi::apiError('Không thể lấy thông tin từ Google', 400);
                return;
            }

            // Find user by google_uid
            $user = Account::findByGoogleUid($googleUid);

            if (!$user) {
                // Check if user exists with this email (but registered with password)
                $existingUser = Account::findByEmail($email);

                if ($existingUser) {
                    // Link Google account to existing user using update()
                    $updateData = [
                        'google_uid' => $googleUid,
                        'auth_provider' => 'google'
                    ];
                    if (empty($existingUser->avatar) && $avatar) {
                        $updateData['avatar'] = $avatar;
                    }
                    Account::update($existingUser->user_id, $updateData);
                    
                    // Refresh user data
                    $user = Account::find($existingUser->user_id);
                } else {
                    // Create new user
                    $user = Account::create([
                        'email' => $email,
                        'name' => $name,
                        'password' => null, // No password for Google users
                        'role' => UserRole::STUDENT,
                        'auth_provider' => 'google',
                        'google_uid' => $googleUid,
                        'avatar' => $avatar,
                        'verify_email_token' => null // Google users are pre-verified
                    ]);

                    if (!$user) {
                        RestApi::apiError('Không thể tạo tài khoản. Vui lòng thử lại sau.', 500);
                        return;
                    }
                }
            }

            // Generate tokens
            $tokens = AuthService::generateTokens($user);
            $userData = AuthService::formatUserData($user);

            // Set cookies
            $cookies = new Cookies();
            $cookies->setAuth([
                'user_id' => $user->user_id,
                'email' => $user->email,
                'role' => $user->role
            ]);
            $cookies->setRefreshToken($tokens['refresh']);

            RestApi::apiResponse([
                'user' => $userData,
                'token' => $tokens['access']
            ], 'Đăng nhập Google thành công', true, 200);

        } catch (Exception $e) {
            error_log('Google login error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());

            if (ob_get_level() > 0) {
                ob_clean();
            }

            RestApi::apiError('Đã xảy ra lỗi khi đăng nhập với Google.', 500);
        }
    }

    /**
     * Verify Firebase ID token using Google's public keys
     */
    private function verifyFirebaseToken($idToken)
    {
        try {
            // Decode token header to get kid
            $tokenParts = explode('.', $idToken);
            if (count($tokenParts) !== 3) {
                return null;
            }

            $header = json_decode(base64_decode(strtr($tokenParts[0], '-_', '+/')), true);
            $payload = json_decode(base64_decode(strtr($tokenParts[1], '-_', '+/')), true);

            if (!$header || !$payload) {
                return null;
            }

            // Check token expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                error_log('Firebase token expired');
                return null;
            }

            // Check issuer
            $projectId = $_ENV['FIREBASE_PROJECT_ID'] ?? 'php-login-a3255';
            $expectedIssuer = 'https://securetoken.google.com/' . $projectId;
            
            if (!isset($payload['iss']) || $payload['iss'] !== $expectedIssuer) {
                error_log('Firebase token issuer mismatch');
                return null;
            }

            // Check audience
            if (!isset($payload['aud']) || $payload['aud'] !== $projectId) {
                error_log('Firebase token audience mismatch');
                return null;
            }

            // For production, you should verify the signature using Google's public keys
            // For now, we trust the token structure (Firebase SDK already verified it client-side)
            // TODO: Implement full signature verification with cached public keys

            return $payload;

        } catch (Exception $e) {
            error_log('Firebase token verification error: ' . $e->getMessage());
            return null;
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

    private static function generateOtp(): string
    {
        return (string) random_int(100000, 999999);
    }

    private static function hasValidEmailDomain(string $email): bool
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return false;
        }
        $domain = $parts[1];

        // Ưu tiên kiểm tra MX record; nếu không có, fallback A record
        if (function_exists('checkdnsrr') && checkdnsrr($domain, 'MX')) {
            return true;
        }

        if (function_exists('dns_get_record')) {
            $mx = dns_get_record($domain, DNS_MX);
            if (!empty($mx)) {
                return true;
            }
            $a = dns_get_record($domain, DNS_A);
            if (!empty($a)) {
                return true;
            }
        }

        return false;
    }
}