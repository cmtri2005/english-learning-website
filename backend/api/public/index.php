<?php
// Simple router for API endpoints
header("Content-Type: application/json; charset=utf-8");

// Handle CORS properly for credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
$allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route to appropriate handler
if (strpos($uri, '/api/auth') === 0) {
    require_once __DIR__ . '/../helpers/Auth.php';
    require_once __DIR__ . '/../helpers/Response.php';
    require_once __DIR__ . '/api/auth/auth.php';
    exit;
}

if (strpos($uri, '/api/users') === 0) {
    require_once __DIR__ . '/../helpers/Auth.php';
    require_once __DIR__ . '/../helpers/Response.php';
    require_once __DIR__ . '/../helpers/Database.php';
    require_once __DIR__ . '/api/users/users.php';
    exit;
}

if (strpos($uri, '/api/blog') === 0) {
    require_once __DIR__ . '/../helpers/Auth.php';
    require_once __DIR__ . '/../helpers/Response.php';
    require_once __DIR__ . '/../helpers/Database.php';
    require_once __DIR__ . '/api/blog_api/blog.php';
    exit;
}

// Default 404
http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
