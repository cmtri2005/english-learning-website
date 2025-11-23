<?php
// Headers already set in index.php
// Auth, Response, and Database classes already loaded

$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    $pdo = Database::getInstance()->getConnection();

    // GET /api/users - List users (Admin only)
    if ($path === '/api/users' && $method === 'GET') {
        $currentUser = $auth->requireRole('admin', 'teacher');
        
        $stmt = $pdo->query("
            SELECT id, name, email, role, is_active, email_verified, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 100
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($users);
    }

    // GET /api/users/:id - Get specific user
    if (preg_match('#^/api/users/(\d+)$#', $path, $matches) && $method === 'GET') {
        $userId = $matches[1];
        $currentUser = $auth->requireAuth();
        
        // Users can only view their own profile unless admin/teacher
        if ($currentUser['id'] != $userId && !in_array($currentUser['role'], ['admin', 'teacher'])) {
            Response::forbidden('You can only view your own profile');
        }
        
        $stmt = $pdo->prepare("
            SELECT id, name, email, avatar, role, email_verified, created_at 
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::notFound('User not found');
        }
        
        Response::success($user);
    }

    Response::notFound('Users endpoint not found');
    
} catch (Exception $e) {
    error_log("Users API Error: " . $e->getMessage());
    Response::serverError($e->getMessage());
}
