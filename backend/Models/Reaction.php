<?php

namespace App\Models;

use App\Core\Model;
use PDO;

class Reaction extends Model
{
    protected static $table = 'reactions';
    protected static $primaryKey = 'reaction_id';

    public $reaction_id;
    public $user_id;
    public $blog_id;
    public $comment_id;
    public $created_at;
    public $updated_at;

    /**
     * Find reaction by user and blog
     */
    public static function findByUserAndBlog($userId, $blogId)
    {
        $query = "SELECT * FROM " . static::$table . " 
                  WHERE user_id = :user_id AND blog_id = :blog_id
                  LIMIT 1";
        
        $results = self::query($query, [
            'user_id' => $userId,
            'blog_id' => $blogId
        ]);
        
        return $results[0] ?? null;
    }

    /**
     * Find reaction by user and comment
     */
    public static function findByUserAndComment($userId, $commentId)
    {
        $query = "SELECT * FROM " . static::$table . " 
                  WHERE user_id = :user_id AND comment_id = :comment_id
                  LIMIT 1";
        
        $results = self::query($query, [
            'user_id' => $userId,
            'comment_id' => $commentId
        ]);
        
        return $results[0] ?? null;
    }

    /**
     * Toggle reaction on blog (like only)
     * Returns: ['action' => 'added'|'removed', 'has_reacted' => bool, 'count' => count]
     */
    public static function toggleBlogReaction($userId, $blogId)
    {
        $existing = self::findByUserAndBlog($userId, $blogId);

        if ($existing) {
            // Remove reaction
            self::delete($existing->reaction_id);
            return [
                'action' => 'removed',
                'has_reacted' => false,
                'count' => self::getCountByBlog($blogId)
            ];
        } else {
            // Add new reaction
            self::create([
                'user_id' => $userId,
                'blog_id' => $blogId,
                'comment_id' => null
            ]);
            return [
                'action' => 'added',
                'has_reacted' => true,
                'count' => self::getCountByBlog($blogId)
            ];
        }
    }

    /**
     * Toggle reaction on comment (like only)
     * Returns: ['action' => 'added'|'removed', 'has_reacted' => bool, 'count' => count]
     */
    public static function toggleCommentReaction($userId, $commentId)
    {
        $existing = self::findByUserAndComment($userId, $commentId);

        if ($existing) {
            // Remove reaction
            self::delete($existing->reaction_id);
            return [
                'action' => 'removed',
                'has_reacted' => false,
                'count' => self::getCountByComment($commentId)
            ];
        } else {
            // Add new reaction
            self::create([
                'user_id' => $userId,
                'blog_id' => null,
                'comment_id' => $commentId
            ]);
            return [
                'action' => 'added',
                'has_reacted' => true,
                'count' => self::getCountByComment($commentId)
            ];
        }
    }

    /**
     * Get reaction count for a blog
     */
    public static function getCountByBlog($blogId)
    {
        $query = "SELECT COUNT(*) FROM " . static::$table . " WHERE blog_id = :blog_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':blog_id', $blogId);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    /**
     * Get reaction count for a comment
     */
    public static function getCountByComment($commentId)
    {
        $query = "SELECT COUNT(*) FROM " . static::$table . " WHERE comment_id = :comment_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':comment_id', $commentId);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    /**
     * Check if user has reacted to blog
     */
    public static function getUserReactionForBlog($userId, $blogId)
    {
        $reaction = self::findByUserAndBlog($userId, $blogId);
        return $reaction ? true : false;
    }

    /**
     * Check if user has reacted to comment
     */
    public static function getUserReactionForComment($userId, $commentId)
    {
        $reaction = self::findByUserAndComment($userId, $commentId);
        return $reaction ? true : false;
    }
}
