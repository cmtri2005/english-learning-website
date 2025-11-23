<?php
// Headers already set in index.php
// Auth and Response classes already loaded

$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Helper function to get JSON body
function getJsonBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

try {
    // POST /api/auth/register
    if ($path === '/api/auth/register' && $method === 'POST') {
        $data = getJsonBody();
        
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $name = $data['name'] ?? '';
        $role = $data['role'] ?? 'student';
        
        $result = $auth->register($email, $password, $name, $role);
        Response::success($result, 'Registration successful');
    }

    // POST /api/auth/login
    if ($path === '/api/auth/login' && $method === 'POST') {
        $data = getJsonBody();
        
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $result = $auth->login($email, $password);
        Response::success($result, 'Login successful');
    }

    // POST /api/auth/logout
    if ($path === '/api/auth/logout' && $method === 'POST') {
        $data = getJsonBody();
        $token = $data['token'] ?? '';
        
        if ($token) {
            $auth->logout($token);
        }
        
        Response::success(null, 'Logout successful');
    }

    // GET /api/auth/me - Get current user
    if ($path === '/api/auth/me' && $method === 'GET') {
        $user = $auth->requireAuth();
        Response::success($user);
    }

    // POST /api/auth/refresh - Refresh access token
    if ($path === '/api/auth/refresh' && $method === 'POST') {
        $data = getJsonBody();
        $refreshToken = $data['refreshToken'] ?? '';
        
        if (!$refreshToken) {
            Response::error('Refresh token is required', 400);
        }
        
        $result = $auth->refreshToken($refreshToken);
        Response::success($result, 'Token refreshed');
    }

    // If no route matched
    Response::notFound('Auth endpoint not found');
    
} catch (Exception $e) {
    error_log("Auth API Error: " . $e->getMessage());
    Response::serverError($e->getMessage());
}
