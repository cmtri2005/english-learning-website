<?php

namespace App\Models;

use App\Core\Model;
use PDO;

class Blog extends Model
{
    protected static $table = 'blogs';
    protected static $primaryKey = 'blog_id';

    public $blog_id;
    public $user_id;
    public $category_id;
    public $title;
    public $slug;
    public $excerpt;
    public $status;
    public $meta_title;
    public $meta_description;
    public $view_count;
    public $created_at;
    public $updated_at;

    // Dynamic properties from JOINs
    public $author_name;
    public $author_avatar;
    public $author_email;
    public $category_name;
    public $category_slug;
    public $likes_count;
    public $comments_count;

    /**
     * Find blog by slug
     */
    public static function findBySlug($slug)
    {
        return self::findOneBy('slug', $slug);
    }

    /**
     * Get blog with author information
     */
    public static function getWithAuthor($blogId)
    {
        $query = "SELECT b.*, 
                         a.name as author_name, 
                         a.avatar as author_avatar,
                         a.email as author_email
                  FROM " . static::$table . " b
                  LEFT JOIN accounts a ON b.user_id = a.user_id
                  WHERE b.blog_id = :blog_id
                  LIMIT 1";

        $results = self::query($query, ['blog_id' => $blogId]);
        return $results[0] ?? null;
    }

    /**
     * Get blog by slug with author and category
     */
    public static function getBySlugWithDetails($slug)
    {
        $query = "SELECT b.*, 
                         a.name as author_name, 
                         a.avatar as author_avatar,
                         a.email as author_email,
                         c.name as category_name,
                         c.slug as category_slug,
                         (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.blog_id) as likes_count,
                         (SELECT COUNT(*) FROM comments cm WHERE cm.blog_id = b.blog_id) as comments_count
                  FROM " . static::$table . " b
                  LEFT JOIN accounts a ON b.user_id = a.user_id
                  LEFT JOIN blog_categories c ON b.category_id = c.category_id
                  WHERE b.slug = :slug
                  LIMIT 1";

        $results = self::query($query, ['slug' => $slug]);
        return $results[0] ?? null;
    }

    /**
     * Get blog by ID with author and category
     */
    public static function getByIdWithDetails($blogId)
    {
        $query = "SELECT b.*, 
                         a.name as author_name, 
                         a.avatar as author_avatar,
                         a.email as author_email,
                         c.name as category_name,
                         c.slug as category_slug,
                         (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.blog_id) as likes_count,
                         (SELECT COUNT(*) FROM comments cm WHERE cm.blog_id = b.blog_id) as comments_count
                  FROM " . static::$table . " b
                  LEFT JOIN accounts a ON b.user_id = a.user_id
                  LEFT JOIN blog_categories c ON b.category_id = c.category_id
                  WHERE b.blog_id = :blog_id
                  LIMIT 1";

        $results = self::query($query, ['blog_id' => $blogId]);
        return $results[0] ?? null;
    }

    /**
     * Get paginated blogs with filters
     */
    public static function getPaginated(
        $page = 1,
        $perPage = 10,
        $categoryId = null,
        $tagId = null,
        $search = null,
        $status = 'published',
        $userId = null
    ) {
        $params = [];
        $whereConditions = [];

        // Base query
        $baseQuery = "FROM " . static::$table . " b
                      LEFT JOIN accounts a ON b.user_id = a.user_id
                      LEFT JOIN blog_categories c ON b.category_id = c.category_id";

        // Add tag join if filtering by tag
        if ($tagId) {
            $baseQuery .= " INNER JOIN blog_post_tags bpt ON b.blog_id = bpt.blog_id";
            $whereConditions[] = "bpt.tag_id = :tag_id";
            $params['tag_id'] = $tagId;
        }

        // Status filter
        if ($status) {
            $whereConditions[] = "b.status = :status";
            $params['status'] = $status;
        }

        // Category filter
        if ($categoryId) {
            $whereConditions[] = "b.category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        // User filter
        if ($userId) {
            $whereConditions[] = "b.user_id = :user_id";
            $params['user_id'] = $userId;
        }

        // Search filter
        if ($search) {
            $whereConditions[] = "(b.title LIKE :search OR b.excerpt LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }

        // Build WHERE clause
        $whereClause = "";
        if (!empty($whereConditions)) {
            $whereClause = " WHERE " . implode(" AND ", $whereConditions);
        }

        // Count total
        $countQuery = "SELECT COUNT(DISTINCT b.blog_id) " . $baseQuery . $whereClause;
        $countStmt = self::db()->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(":{$key}", $value);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Calculate pagination
        $page = max(1, (int) $page);
        $perPage = max(1, (int) $perPage);
        $offset = ($page - 1) * $perPage;
        $lastPage = ceil($total / $perPage);

        // Get data
        $dataQuery = "SELECT DISTINCT b.*, 
                             a.name as author_name, 
                             a.avatar as author_avatar,
                             c.name as category_name,
                             c.slug as category_slug,
                             (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.blog_id) as likes_count,
                             (SELECT COUNT(*) FROM comments cm WHERE cm.blog_id = b.blog_id) as comments_count
                      " . $baseQuery . $whereClause . "
                      ORDER BY b.created_at DESC
                      LIMIT :limit OFFSET :offset";

        $stmt = self::db()->prepare($dataQuery);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
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
     * Increment view count
     */
    public function incrementViews()
    {
        $query = "UPDATE " . static::$table . " SET view_count = view_count + 1 WHERE blog_id = :blog_id";
        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':blog_id', $this->blog_id);
        return $stmt->execute();
    }

    /**
     * Get blogs by user
     */
    public static function getByUser($userId, $page = 1, $perPage = 10)
    {
        return self::getPaginated($page, $perPage, null, null, null, null, $userId);
    }

    /**
     * Get tags for blog
     */
    public function getTags()
    {
        $query = "SELECT t.* FROM blog_tags t
                  INNER JOIN blog_post_tags bpt ON t.tag_id = bpt.tag_id
                  WHERE bpt.blog_id = :blog_id";
        
        return BlogTag::query($query, ['blog_id' => $this->blog_id]);
    }
}
