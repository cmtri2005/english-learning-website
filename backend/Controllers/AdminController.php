<?php

namespace App\Controllers;

use App\Core\RestApi;
use App\Core\UserRole;
use App\Helper\Database;

class AdminController
{
    /**
     * Get all users (admin only)
     */
    public function getUsers()
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        // Check admin role
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        // Get all users
        $stmt = $pdo->query("
            SELECT user_id, name, email, role, created_at, updated_at
            FROM accounts
            ORDER BY created_at DESC
        ");
        $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        RestApi::apiResponse(['users' => $users], 'Success');
    }

    /**
     * Update user role/status (admin only)
     */
    public function updateUser($id)
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        
        // Check admin role
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        $body = RestApi::getBody();
        $role = $body['role'] ?? null;

        if (!$role || !in_array($role, [UserRole::ADMIN, UserRole::STUDENT])) {
            RestApi::apiError('Invalid role', 400);
            return;
        }

        // Prevent self role change
        if ((int)$id === $userId) {
            RestApi::apiError('Cannot change your own role', 400);
            return;
        }

        $stmt = $pdo->prepare("UPDATE accounts SET role = :role, updated_at = NOW() WHERE user_id = :id");
        $stmt->execute([':role' => $role, ':id' => $id]);

        RestApi::apiResponse(null, 'User updated successfully');
    }

    /**
     * Delete user (admin only)
     */
    public function deleteUser($id)
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        
        // Check admin role
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        // Prevent self deletion
        if ((int)$id === $userId) {
            RestApi::apiError('Cannot delete yourself', 400);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $id]);

        RestApi::apiResponse(null, 'User deleted successfully');
    }

    /**
     * Get admin dashboard stats
     */
    public function getStats()
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        
        // Check admin role
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        // Get stats
        $stats = [];

        // Total users
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM accounts");
        $stats['total_users'] = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];

        // Total exams
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM exams");
        $stats['total_exams'] = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];

        // Total blogs
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM blogs");
        $stats['total_blogs'] = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];

        // Total exam attempts
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM exam_attempts");
        $stats['total_attempts'] = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];

        // Recent users (last 7 days)
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM accounts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        $stats['new_users_week'] = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];

        RestApi::apiResponse(['stats' => $stats], 'Success');
    }

    /**
     * Get all blogs for moderation (admin only)
     */
    public function getBlogs()
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        
        // Check admin role
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        // Get all blogs with author info
        $stmt = $pdo->query("
            SELECT b.blog_id as id, b.title, b.slug, b.status, b.created_at, b.updated_at,
                   a.name as author_name, a.email as author_email
            FROM blogs b
            LEFT JOIN accounts a ON b.user_id = a.user_id
            ORDER BY b.created_at DESC
        ");
        $blogs = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        RestApi::apiResponse(['blogs' => $blogs], 'Success');
    }

    /**
     * Update blog status (admin only)
     */
    public function updateBlog($id)
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        
        // Check admin role
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        $body = RestApi::getBody();
        $status = $body['status'] ?? null;

        if (!$status || !in_array($status, ['draft', 'published', 'archived'])) {
            RestApi::apiError('Invalid status', 400);
            return;
        }

        $stmt = $pdo->prepare("UPDATE blogs SET status = :status, updated_at = NOW() WHERE blog_id = :id");
        $stmt->execute([':status' => $status, ':id' => $id]);

        RestApi::apiResponse(null, 'Blog updated successfully');
    }

    /**
     * Delete blog (admin only)
     */
    public function deleteBlog($id)
    {
        RestApi::setHeaders();
        
        $userId = RestApi::getCurrentUserId();
        if (!$userId) {
            RestApi::apiError('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        
        // Check admin role
        $stmt = $pdo->prepare("SELECT role FROM accounts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== UserRole::ADMIN) {
            RestApi::apiError('Admin access required', 403);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM blogs WHERE blog_id = :id");
        $stmt->execute([':id' => $id]);

        RestApi::apiResponse(null, 'Blog deleted successfully');
    }
}
