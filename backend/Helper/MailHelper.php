<?php

namespace App\Helper;

use App\Core\Mail;


class MailHelper
{
    public static function send($to, $subject, $message)
    {
        try {
            $mailer = new Mail();
            return $mailer->send($to, $subject, $message);
        } catch (\Throwable $e) {
            error_log("MailHelper send error: " . $e->getMessage());
            return false;
        }
    }

    public static function sendPasswordResetEmail($to, $newPassword, $userName = '')
    {
        $subject = 'Mật khẩu mới - MonoLingo';

        $greeting = !empty($userName) ? "Xin chào {$userName}," : "Xin chào,";

        $message = "
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .password-box { background: #fff; padding: 20px; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0; text-align: center; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
                        .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔐 Mật khẩu mới của bạn</h1>
                        </div>
                        <div class='content'>
                            <p>{$greeting}</p>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                            <p>Mật khẩu mới của bạn đã được tạo và cập nhật vào hệ thống:</p>
                            <div class='password-box'>{$newPassword}</div>
                            <div class='warning-box'>
                                <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
                                <ul style='margin: 10px 0; padding-left: 20px;'>
                                    <li>Vui lòng đăng nhập ngay với mật khẩu mới này</li>
                                    <li>Sau khi đăng nhập, bạn nên đổi mật khẩu thành mật khẩu dễ nhớ hơn trong phần Cài đặt</li>
                                    <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
                                    <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ admin ngay lập tức</li>
                                </ul>
                            </div>
                            <p>Trân trọng,<br><strong>Đội ngũ MonoLingo</strong></p>
                        </div>
                        <div class='footer'>
                            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                            <p>&copy; " . date('Y') . " MonoLingo. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                        ";

        return self::send($to, $subject, $message);
    }

    public static function sendResetLinkEmail($to, $token, $userName = '')
    {
        $appUrl = $_ENV['APP_URL'] ?? 'http://localhost:5173';
        $resetUrl = "{$appUrl}/reset-password?token={$token}";
        $subject = 'Đặt lại mật khẩu - MonoLingo';
        $greeting = !empty($userName) ? "Xin chào {$userName}," : "Xin chào,";

        $message = "
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .token { background: #fff; padding: 15px; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0; text-align: center; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔑 Đặt lại mật khẩu</h1>
                        </div>
                        <div class='content'>
                            <p>{$greeting}</p>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                            <p>Nhấp nút dưới đây để đặt lại mật khẩu (có hiệu lực 60 phút):</p>
                            <p style='text-align: center;'>
                                <a href='{$resetUrl}' class='button'>Đặt lại mật khẩu</a>
                            </p>
                            <p>Nếu bạn cần nhập mã thủ công, đây là mã của bạn:</p>
                            <div class='token'>{$token}</div>
                            <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                            <p>Trân trọng,<br><strong>Đội ngũ MonoLingo</strong></p>
                        </div>
                        <div class='footer'>
                            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                            <p>&copy; " . date('Y') . " MonoLingo. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                        ";
        return self::send($to, $subject, $message);
    }


    public static function sendRegisterOtpEmail($to, $otp, $userName = '')
    {
        $subject = 'Mã xác minh đăng ký - MonoLingo';
        $greeting = !empty($userName) ? "Xin chào {$userName}," : "Xin chào,";

        $message = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: #fff; padding: 20px; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0; text-align: center; font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 4px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🔐 Xác minh email</h1>
                    </div>
                    <div class='content'>
                        <p>{$greeting}</p>
                        <p>Đây là mã OTP để xác minh email của bạn. Mã có hiệu lực trong 10 phút:</p>
                        <div class='otp-box'>{$otp}</div>
                        <p>Nếu bạn không yêu cầu đăng ký tài khoản, hãy bỏ qua email này.</p>
                        <p>Trân trọng,<br><strong>Đội ngũ MonoLingo</strong></p>
                    </div>
                    <div class='footer'>
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                        <p>&copy; " . date('Y') . " MonoLingo. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
                    ";

        return self::send($to, $subject, $message);
    }

    public static function sendVerificationEmail($to, $token, $userName = '')
    {
        $appUrl = $_ENV['APP_URL'] ?? 'http://localhost:5173';
        $verifyUrl = "{$appUrl}/verify-email?token={$token}";

        $subject = 'Xác nhận email - MonoLingo';

        $greeting = !empty($userName) ? "Xin chào {$userName}," : "Xin chào,";

        $message = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✅ Xác nhận email</h1>
                    </div>
                    <div class='content'>
                        <p>{$greeting}</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại MonoLingo!</p>
                        <p>Vui lòng nhấp vào nút bên dưới để xác nhận địa chỉ email của bạn:</p>
                        <p style='text-align: center;'>
                            <a href='{$verifyUrl}' class='button'>Xác nhận email</a>
                        </p>
                        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                        <p>Trân trọng,<br><strong>Đội ngũ MonoLingo</strong></p>
                    </div>
                    <div class='footer'>
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                        <p>&copy; " . date('Y') . " MonoLingo. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
                    ";

        return self::send($to, $subject, $message);
    }
}

