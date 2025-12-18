<?php

namespace App\Models;

use App\Core\Model;
use PDO;

class Comment extends Model
{
    protected static $table = 'comments';
    protected static $primaryKey = 'comment_id';

    public $comment_id;
    public $blog_id;
    public $user_id;
    public $content;
    public $old_content;
    public $created_at;
    public $updated_at;

    // Dynamic properties from JOINs
    public $author_name;
    public $author_avatar;
    public $likes_count;
    public $user_reaction;

    /**
     * Get comments by blog ID with author info
     */
    public static function getByBlogId($blogId, $page = 1, $perPage = 20)
    {
        $params = ['blog_id' => $blogId];

        // Count total
        $countQuery = "SELECT COUNT(*) FROM " . static::$table . " WHERE blog_id = :blog_id";
        $countStmt = self::db()->prepare($countQuery);
        $countStmt->bindValue(':blog_id', $blogId);
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Calculate pagination
        $page = max(1, (int) $page);
        $perPage = max(1, (int) $perPage);
        $offset = ($page - 1) * $perPage;
        $lastPage = ceil($total / $perPage);

        // Get data with author info
        $query = "SELECT c.*, 
                         a.name as author_name, 
                         a.avatar as author_avatar,
                         (SELECT COUNT(*) FROM reactions r WHERE r.comment_id = c.comment_id) as likes_count
                  FROM " . static::$table . " c
                  LEFT JOIN accounts a ON c.user_id = a.user_id
                  WHERE c.blog_id = :blog_id
                  ORDER BY c.created_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':blog_id', $blogId);
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_CLASS, static::class);

        return [
            'data' => $data,
            'total' => $total,
            'current_page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
            'from' => $total > 0 ? $offset + 1 : 0,
            'to' => min($offset + $perPage, $total)
        ];
    }

    /**
     * Get comment with author info
     */
    public static function getWithAuthor($commentId)
    {
        $query = "SELECT c.*, 
                         a.name as author_name, 
                         a.avatar as author_avatar,
                         (SELECT COUNT(*) FROM reactions r WHERE r.comment_id = c.comment_id) as likes_count
                  FROM " . static::$table . " c
                  LEFT JOIN accounts a ON c.user_id = a.user_id
                  WHERE c.comment_id = :comment_id
                  LIMIT 1";

        $results = self::query($query, ['comment_id' => $commentId]);
        return $results[0] ?? null;
    }

    /**
     * Save old content before update
     */
    public function saveOldContent()
    {
        $query = "UPDATE " . static::$table . " 
                  SET old_content = content 
                  WHERE comment_id = :comment_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':comment_id', $this->comment_id);
        return $stmt->execute();
    }

    /**
     * Update comment with history
     */
    public function updateWithHistory($newContent)
    {
        // Save old content first
        $this->saveOldContent();

        // Update with new content
        $query = "UPDATE " . static::$table . " 
                  SET content = :content, updated_at = NOW() 
                  WHERE comment_id = :comment_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':content', $newContent);
        $stmt->bindValue(':comment_id', $this->comment_id);
        return $stmt->execute();
    }

    /**
     * Get comment count for a blog
     */
    public static function getCountByBlog($blogId)
    {
        $query = "SELECT COUNT(*) FROM " . static::$table . " WHERE blog_id = :blog_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':blog_id', $blogId);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }
}
