<?php
/**
 * Entry point cho tất cả requests
 * Xử lý CORS preflight requests trước khi routing
 */

// Tắt display errors để tránh HTML output
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
ini_set('log_errors', '1');

// Bật output buffering để tránh output trước JSON
ob_start();

// Lấy origin từ request header
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
];

// Nếu origin được phép, dùng nó; nếu không, dùng origin từ request hoặc mặc định
$corsOrigin = '*';
if ($origin && in_array($origin, $allowedOrigins)) {
    $corsOrigin = $origin;
} elseif ($origin) {
    // Cho phép origin từ request nếu trong development
    $corsOrigin = $origin;
}

// Xử lý CORS preflight request (OPTIONS) ngay từ đầu
// Phải xử lý trước bất kỳ output nào
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Set CORS headers
    header("Access-Control-Allow-Origin: " . $corsOrigin);
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 3600");
    http_response_code(200);
    exit(0);
}

// Set CORS headers cho tất cả requests (không chỉ OPTIONS)
header("Access-Control-Allow-Origin: " . $corsOrigin);
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Autoload classes (phải load trước error handlers)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

// Error handler để đảm bảo tất cả errors trả về JSON
// Chỉ xử lý fatal errors, warnings/notices chỉ log
set_error_handler(function ($severity, $message, $file, $line) {
    // Log tất cả errors
    error_log("PHP Error [$severity]: $message in $file:$line");
    
    // Chỉ xử lý fatal errors, warnings/notices không dừng execution
    if ($severity === E_ERROR || $severity === E_PARSE || $severity === E_CORE_ERROR || $severity === E_COMPILE_ERROR) {
        // Clean output buffer
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        if (class_exists('\App\Core\RestApi')) {
            \App\Core\RestApi::setHeaders();
            \App\Core\RestApi::apiError('Đã xảy ra lỗi server', 500);
        } else {
            header("Content-Type: application/json");
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Đã xảy ra lỗi server']);
        }
        exit();
    }
    
    // Với warnings/notices, chỉ return false để PHP xử lý bình thường
    // Nhưng vì đã tắt display_errors, sẽ không có output
    return false;
}, E_ALL & ~E_DEPRECATED & ~E_STRICT);

// Exception handler
set_exception_handler(function ($exception) {
    error_log("Uncaught Exception: " . $exception->getMessage());
    if (class_exists('\App\Core\RestApi')) {
        \App\Core\RestApi::setHeaders();
        \App\Core\RestApi::apiError('Đã xảy ra lỗi không mong muốn', 500);
    } else {
        header("Content-Type: application/json");
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Đã xảy ra lỗi không mong muốn']);
    }
    exit();
});

try {
    // Initialize router
    $router = new \App\Routes\Router();

    // Load route files (bỏ qua Router.php vì nó là class, không phải route definition)
    $routesPath = __DIR__ . '/Routes';
    if (is_dir($routesPath)) {
        $routeFiles = glob($routesPath . '/*.php');
        foreach ($routeFiles as $routeFile) {
            $filename = basename($routeFile);
            // Bỏ qua Router.php vì nó đã được autoload
            if ($filename === 'Router.php') {
                continue;
            }
            // Load route file trong output buffer để catch mọi output
            ob_start();
            require $routeFile;
            $output = ob_get_clean();
            // Nếu có output không mong muốn, log và clean
            if (!empty($output)) {
                error_log("Unexpected output from route file $filename: $output");
            }
        }
    }

    // Dispatch request
    $router->dispatch();
} catch (\Throwable $e) {
    error_log('Fatal error in index.php: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    // Xóa output buffer nếu có
    if (ob_get_level() > 0) {
        ob_clean();
    }
    // Đảm bảo headers đã được set
    if (!headers_sent()) {
        \App\Core\RestApi::setHeaders();
    }
    \App\Core\RestApi::apiError('Đã xảy ra lỗi server', 500);
}
