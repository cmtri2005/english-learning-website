<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';

class Auth {
    private PDO $pdo;
    
    // Token expires in 24 hours
    private const TOKEN_EXPIRY = 86400;
    
    // Refresh token expires in 30 days
    private const REFRESH_TOKEN_EXPIRY = 2592000;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    /**
     * Register a new user
     */
    public function register(string $email, string $password, string $name, string $role = 'student'): array {
        // Validate inputs
        $errors = [];
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        }
        
        if (strlen($password) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }
        
        if (strlen($name) < 2) {
            $errors['name'] = 'Name must be at least 2 characters';
        }
        
        if (!in_array($role, ['student', 'teacher', 'admin'])) {
            $errors['role'] = 'Invalid role';
        }
        
        if (!empty($errors)) {
            Response::validationError('Validation failed', $errors);
        }

        // Check if email already exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->fetch()) {
            Response::error('Email already registered', 409);
        }

        // Hash password
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        // Insert user
        $stmt = $this->pdo->prepare("
            INSERT INTO users (email, password_hash, name, role) 
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([$email, $passwordHash, $name, $role]);
        $userId = $this->pdo->lastInsertId();

        // Get created user
        $user = $this->getUserById($userId);
        
        // Create session
        $session = $this->createSession($userId);

        return [
            'user' => $user,
            'token' => $session['token'],
            'refreshToken' => $session['refresh_token']
        ];
    }

    /**
     * Login user
     */
    public function login(string $email, string $password): array {
        // Get user
        $stmt = $this->pdo->prepare("
            SELECT id, email, password_hash, name, avatar, role, is_active, email_verified 
            FROM users 
            WHERE email = ?
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Invalid credentials', 401);
        }

        // Check if user is active
        if (!$user['is_active']) {
            Response::error('Account is deactivated', 403);
        }

        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            Response::error('Invalid credentials', 401);
        }

        // Remove password hash from response
        unset($user['password_hash']);

        // Create session
        $session = $this->createSession($user['id']);

        return [
            'user' => $user,
            'token' => $session['token'],
            'refreshToken' => $session['refresh_token']
        ];
    }

    /**
     * Create a new session
     */
    private function createSession(int $userId): array {
        $token = bin2hex(random_bytes(32));
        $refreshToken = bin2hex(random_bytes(32));
        
        $expiresAt = date('Y-m-d H:i:s', time() + self::TOKEN_EXPIRY);
        $refreshExpiresAt = date('Y-m-d H:i:s', time() + self::REFRESH_TOKEN_EXPIRY);
        
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        $stmt = $this->pdo->prepare("
            INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $token,
            $refreshToken,
            $expiresAt,
            $refreshExpiresAt,
            $ipAddress,
            $userAgent
        ]);

        return [
            'token' => $token,
            'refresh_token' => $refreshToken,
            'expires_at' => $expiresAt,
            'refresh_expires_at' => $refreshExpiresAt
        ];
    }

    /**
     * Validate token and return user
     */
    public function validateToken(string $token): ?array {
        $stmt = $this->pdo->prepare("
            SELECT s.user_id, s.expires_at, u.email, u.name, u.avatar, u.role, u.is_active
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW()
        ");
        
        $stmt->execute([$token]);
        $result = $stmt->fetch();

        if (!$result) {
            return null;
        }

        if (!$result['is_active']) {
            return null;
        }

        return [
            'id' => $result['user_id'],
            'email' => $result['email'],
            'name' => $result['name'],
            'avatar' => $result['avatar'],
            'role' => $result['role']
        ];
    }

    /**
     * Refresh access token using refresh token
     */
    public function refreshToken(string $refreshToken): array {
        $stmt = $this->pdo->prepare("
            SELECT s.id, s.user_id, s.refresh_expires_at
            FROM sessions s
            WHERE s.refresh_token = ? AND s.refresh_expires_at > NOW()
        ");
        
        $stmt->execute([$refreshToken]);
        $session = $stmt->fetch();

        if (!$session) {
            Response::error('Invalid or expired refresh token', 401);
        }

        // Delete old session
        $stmt = $this->pdo->prepare("DELETE FROM sessions WHERE id = ?");
        $stmt->execute([$session['id']]);

        // Create new session
        $newSession = $this->createSession($session['user_id']);
        $user = $this->getUserById($session['user_id']);

        return [
            'user' => $user,
            'token' => $newSession['token'],
            'refreshToken' => $newSession['refresh_token']
        ];
    }

    /**
     * Logout - delete session
     */
    public function logout(string $token): void {
        $stmt = $this->pdo->prepare("DELETE FROM sessions WHERE token = ?");
        $stmt->execute([$token]);
    }

    /**
     * Get user by ID
     */
    private function getUserById(int $userId): array {
        $stmt = $this->pdo->prepare("
            SELECT id, email, name, avatar, role, email_verified, created_at
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    /**
     * Get current user from request
     */
    public function getCurrentUser(): ?array {
        $token = $this->getTokenFromRequest();
        
        if (!$token) {
            return null;
        }

        return $this->validateToken($token);
    }

    /**
     * Require authentication - exit if not authenticated
     */
    public function requireAuth(): array {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            Response::unauthorized('Authentication required');
        }

        return $user;
    }

    /**
     * Require specific role
     */
    public function requireRole(string ...$roles): array {
        $user = $this->requireAuth();
        
        if (!in_array($user['role'], $roles)) {
            Response::forbidden('Insufficient permissions');
        }

        return $user;
    }

    /**
     * Extract token from Authorization header
     */
    private function getTokenFromRequest(): ?string {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            return null;
        }

        $authHeader = $headers['Authorization'];
        
        // Check for "Bearer <token>" format
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
