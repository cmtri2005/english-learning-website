<?php

namespace App\Helper;

use Exception;

/**
 * MailHelper - Helper gửi email
 * 
 * Hỗ trợ 2 phương thức:
 * 1. SMTP (khuyến nghị) - Gửi qua SMTP server (Gmail, SendGrid, etc.)
 * 2. PHP mail() native - Fallback nếu không cấu hình SMTP
 */
class MailHelper
{
    /**
     * Gửi email - Tự động chọn phương thức dựa trên config
     * 
     * @param string $to Email người nhận
     * @param string $subject Tiêu đề email
     * @param string $message Nội dung email (HTML hoặc plain text)
     * @param array $headers Optional headers (From, Reply-To, etc.)
     * @return bool true nếu gửi thành công, false nếu thất bại
     */
    public static function send($to, $subject, $message, $headers = [])
    {
        // Nếu có cấu hình SMTP, dùng SMTP
        $smtpHost = $_ENV['MAIL_SMTP_HOST'] ?? '';
        if (!empty($smtpHost)) {
            return self::sendViaSMTP($to, $subject, $message, $headers);
        }

        // Ngược lại, dùng PHP mail() native
        return self::sendViaNative($to, $subject, $message, $headers);
    }

    /**
     * Đọc đầy đủ response từ SMTP server (xử lý multi-line, ví dụ: 250-... 250-... 250 ...)
     *
     * @param resource $socket
     * @return string
     */
    private static function readSmtpResponse($socket): string
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            // Theo RFC: dòng tiếp theo của multi-line response có dạng "XYZ-" (dấu - ở vị trí 4)
            // Dòng cuối cùng có dạng "XYZ " hoặc "XYZ"
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        return $response;
    }

    /**
     * Gửi email qua SMTP
     * 
     * @param string $to Email người nhận
     * @param string $subject Tiêu đề email
     * @param string $message Nội dung email (HTML)
     * @param array $headers Optional headers
     * @return bool
     */
    private static function sendViaSMTP($to, $subject, $message, $headers = [])
    {
        try {
            $smtpHost = $_ENV['MAIL_SMTP_HOST'] ?? 'smtp.gmail.com';
            $smtpPort = (int)($_ENV['MAIL_SMTP_PORT'] ?? 587);
            $smtpUser = $_ENV['MAIL_SMTP_USER'] ?? '';
            $smtpPass = $_ENV['MAIL_SMTP_PASSWORD'] ?? '';
            $smtpEncryption = $_ENV['MAIL_SMTP_ENCRYPTION'] ?? 'tls'; // tls hoặc ssl
            $fromEmail = $_ENV['MAIL_FROM'] ?? $smtpUser;
            $fromName = $_ENV['MAIL_FROM_NAME'] ?? 'MonoLingo';

            if (empty($smtpUser) || empty($smtpPass)) {
                error_log("MailHelper: SMTP credentials not configured");
                return false;
            }

            // Kết nối SMTP
            // Nếu dùng SSL (port 465), cần prefix ssl://
            $connectHost = $smtpHost;
            if ($smtpEncryption === 'ssl') {
                $connectHost = 'ssl://' . $smtpHost;
            }

            $socket = @fsockopen(
                $connectHost,
                $smtpPort,
                $errno,
                $errstr,
                30
            );

            if (!$socket) {
                error_log("MailHelper: Failed to connect to SMTP server {$smtpHost}:{$smtpPort} - {$errstr}");
                return false;
            }

            // Đọc greeting (có thể nhiều dòng, ví dụ: 220-.../220 ...)
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '220') {
                error_log("MailHelper: SMTP server greeting error: {$response}");
                fclose($socket);
                return false;
            }

            // EHLO (response có thể nhiều dòng 250-... 250 ...)
            fputs($socket, "EHLO {$smtpHost}\r\n");
            $response = self::readSmtpResponse($socket);

            // STARTTLS nếu dùng TLS
            if ($smtpEncryption === 'tls' && $smtpPort == 587) {
                fputs($socket, "STARTTLS\r\n");
                $response = self::readSmtpResponse($socket);
                if (substr($response, 0, 3) !== '220') {
                    error_log("MailHelper: STARTTLS failed: {$response}");
                    fclose($socket);
                    return false;
                }
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fputs($socket, "EHLO {$smtpHost}\r\n");
                $response = self::readSmtpResponse($socket);
            }

            // AUTH LOGIN
            fputs($socket, "AUTH LOGIN\r\n");
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '334') {
                error_log("MailHelper: AUTH LOGIN failed: {$response}");
                fclose($socket);
                return false;
            }

            fputs($socket, base64_encode($smtpUser) . "\r\n");
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '334') {
                error_log("MailHelper: Username authentication failed");
                fclose($socket);
                return false;
            }

            fputs($socket, base64_encode($smtpPass) . "\r\n");
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '235') {
                error_log("MailHelper: Password authentication failed");
                fclose($socket);
                return false;
            }

            // MAIL FROM
            fputs($socket, "MAIL FROM: <{$fromEmail}>\r\n");
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '250') {
                error_log("MailHelper: MAIL FROM failed: {$response}");
                fclose($socket);
                return false;
            }

            // RCPT TO
            fputs($socket, "RCPT TO: <{$to}>\r\n");
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '250') {
                error_log("MailHelper: RCPT TO failed: {$response}");
                fclose($socket);
                return false;
            }

            // DATA
            fputs($socket, "DATA\r\n");
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '354') {
                error_log("MailHelper: DATA command failed: {$response}");
                fclose($socket);
                return false;
            }

            // Email headers và body
            $emailContent = "From: {$fromName} <{$fromEmail}>\r\n";
            $emailContent .= "To: <{$to}>\r\n";
            $emailContent .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $emailContent .= "MIME-Version: 1.0\r\n";
            $emailContent .= "Content-Type: text/html; charset=UTF-8\r\n";
            $emailContent .= "Content-Transfer-Encoding: base64\r\n";
            $emailContent .= "\r\n";
            $emailContent .= chunk_split(base64_encode($message));
            $emailContent .= "\r\n.\r\n";

            fputs($socket, $emailContent);
            $response = self::readSmtpResponse($socket);
            if (substr($response, 0, 3) !== '250') {
                error_log("MailHelper: Email sending failed: {$response}");
                fclose($socket);
                return false;
            }

            // QUIT
            fputs($socket, "QUIT\r\n");
            fclose($socket);

            error_log("MailHelper: Email sent successfully via SMTP to {$to}");
            return true;

        } catch (Exception $e) {
            error_log("MailHelper SMTP error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Gửi email dùng PHP mail() native (fallback)
     * 
     * @param string $to Email người nhận
     * @param string $subject Tiêu đề email
     * @param string $message Nội dung email (HTML hoặc plain text)
     * @param array $headers Optional headers (From, Reply-To, etc.)
     * @return bool true nếu gửi thành công, false nếu thất bại
     */
    private static function sendViaNative($to, $subject, $message, $headers = [])
    {
        try {
            // Default headers
            $defaultHeaders = [
                'From' => $_ENV['MAIL_FROM'] ?? 'noreply@monolingo.com',
                'Reply-To' => $_ENV['MAIL_REPLY_TO'] ?? $_ENV['MAIL_FROM'] ?? 'noreply@monolingo.com',
                'X-Mailer' => 'PHP/' . phpversion(),
                'MIME-Version' => '1.0',
                'Content-Type' => 'text/html; charset=UTF-8',
            ];

            // Merge với headers tùy chọn
            $finalHeaders = array_merge($defaultHeaders, $headers);

            // Format headers string
            $headersString = '';
            foreach ($finalHeaders as $key => $value) {
                $headersString .= "{$key}: {$value}\r\n";
            }

            // Gửi email
            $result = mail($to, $subject, $message, $headersString);

            if (!$result) {
                error_log("MailHelper: Failed to send email to {$to} via mail()");
                return false;
            }

            error_log("MailHelper: Email sent successfully via mail() to {$to}");
            return true;

        } catch (Exception $e) {
            error_log("MailHelper error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Gửi email chứa mật khẩu mới
     * 
     * @param string $to Email người nhận
     * @param string $newPassword Mật khẩu mới đã được tạo
     * @param string $userName Tên người dùng (optional)
     * @return bool
     */
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

    /**
     * Gửi email xác nhận đăng ký (nếu cần sau này)
     * 
     * @param string $to
     * @param string $token
     * @param string $userName
     * @return bool
     */
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

