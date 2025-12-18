<?php

namespace App\Models;

use App\Core\Model;
use App\Core\Helper;
use PDO;

class BlogTag extends Model
{
    protected static $table = 'blog_tags';
    protected static $primaryKey = 'tag_id';

    public $tag_id;
    public $name;
    public $slug;
    public $created_at;

    // Dynamic property
    public $blog_count;

    /**
     * Find tag by slug
     */
    public static function findBySlug($slug)
    {
        return self::findOneBy('slug', $slug);
    }

    /**
     * Get all tags with blog count
     */
    public static function getAllWithBlogCount()
    {
        $query = "SELECT t.*, 
                         COUNT(DISTINCT bpt.blog_id) as blog_count
                  FROM " . static::$table . " t
                  LEFT JOIN blog_post_tags bpt ON t.tag_id = bpt.tag_id
                  LEFT JOIN blogs b ON bpt.blog_id = b.blog_id AND b.status = 'published'
                  GROUP BY t.tag_id
                  ORDER BY t.name ASC";

        return self::query($query);
    }

    /**
     * Get tags by blog ID
     */
    public static function getByBlogId($blogId)
    {
        $query = "SELECT t.* FROM " . static::$table . " t
                  INNER JOIN blog_post_tags bpt ON t.tag_id = bpt.tag_id
                  WHERE bpt.blog_id = :blog_id
                  ORDER BY t.name ASC";

        return self::query($query, ['blog_id' => $blogId]);
    }

    /**
     * Attach tag to blog
     */
    public static function attachToBlog($blogId, $tagId)
    {
        $query = "INSERT IGNORE INTO blog_post_tags (blog_id, tag_id) VALUES (:blog_id, :tag_id)";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':blog_id', $blogId);
        $stmt->bindValue(':tag_id', $tagId);
        return $stmt->execute();
    }

    /**
     * Detach tag from blog
     */
    public static function detachFromBlog($blogId, $tagId)
    {
        $query = "DELETE FROM blog_post_tags WHERE blog_id = :blog_id AND tag_id = :tag_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':blog_id', $blogId);
        $stmt->bindValue(':tag_id', $tagId);
        return $stmt->execute();
    }

    /**
     * Sync tags for blog (remove old, add new)
     */
    public static function syncBlogTags($blogId, array $tagIds)
    {
        // Remove all existing tags
        $deleteQuery = "DELETE FROM blog_post_tags WHERE blog_id = :blog_id";
        $stmt = self::db()->prepare($deleteQuery);
        $stmt->bindValue(':blog_id', $blogId);
        $stmt->execute();

        // Add new tags
        foreach ($tagIds as $tagId) {
            self::attachToBlog($blogId, $tagId);
        }

        return true;
    }

    /**
     * Find or create tag by name
     */
    public static function findOrCreate($name)
    {
        $slug = Helper::generateSlug($name);
        $tag = self::findBySlug($slug);

        if (!$tag) {
            $tag = self::create([
                'name' => $name,
                'slug' => $slug
            ]);
        }

        return $tag;
    }
}
