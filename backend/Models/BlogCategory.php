<?php

namespace App\Models;

use App\Core\Model;
use PDO;

class BlogCategory extends Model
{
    protected static $table = 'blog_categories';
    protected static $primaryKey = 'category_id';

    public $category_id;
    public $name;
    public $slug;
    public $description;
    public $created_at;
    public $updated_at;

    // Dynamic property
    public $blog_count;

    /**
     * Find category by slug
     */
    public static function findBySlug($slug)
    {
        return self::findOneBy('slug', $slug);
    }

    /**
     * Get all categories with blog count
     */
    public static function getAllWithBlogCount()
    {
        $query = "SELECT c.*, 
                         COUNT(b.blog_id) as blog_count
                  FROM " . static::$table . " c
                  LEFT JOIN blogs b ON c.category_id = b.category_id AND b.status = 'published'
                  GROUP BY c.category_id
                  ORDER BY c.name ASC";

        return self::query($query);
    }

    /**
     * Get category with blog count
     */
    public static function getWithBlogCount($categoryId)
    {
        $query = "SELECT c.*, 
                         COUNT(b.blog_id) as blog_count
                  FROM " . static::$table . " c
                  LEFT JOIN blogs b ON c.category_id = b.category_id AND b.status = 'published'
                  WHERE c.category_id = :category_id
                  GROUP BY c.category_id
                  LIMIT 1";

        $results = self::query($query, ['category_id' => $categoryId]);
        return $results[0] ?? null;
    }
}
