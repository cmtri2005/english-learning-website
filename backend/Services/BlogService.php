<?php

namespace App\Services;

use App\Core\Helper;
use App\Models\Blog;

class BlogService
{
    // Format blog data for API response
    public static function formatBlogData($blog): array
    {
        if (!$blog) {
            return [];
        }

        $data = [
            'id' => $blog->blog_id ?? null,
            'title' => $blog->title ?? '',
            'slug' => $blog->slug ?? '',
            'excerpt' => $blog->excerpt ?? '',
            'status' => $blog->status ?? 'draft',
            'view_count' => $blog->view_count ?? 0,
            'likes_count' => $blog->likes_count ?? 0,
            'comments_count' => $blog->comments_count ?? 0,
            'meta_title' => $blog->meta_title ?? '',
            'meta_description' => $blog->meta_description ?? '',
            'created_at' => $blog->created_at ?? null,
            'updated_at' => $blog->updated_at ?? null,
        ];

        // Add author info if available
        if (isset($blog->author_name)) {
            $data['author'] = [
                'id' => $blog->user_id ?? null,
                'name' => $blog->author_name ?? '',
                'avatar' => $blog->author_avatar ?? null,
                'email' => $blog->author_email ?? null,
            ];
        } else {
            $data['user_id'] = $blog->user_id ?? null;
        }

        // Add category info if available
        if (isset($blog->category_name)) {
            $data['category'] = [
                'id' => $blog->category_id ?? null,
                'name' => $blog->category_name ?? '',
                'slug' => $blog->category_slug ?? '',
            ];
        } else {
            $data['category_id'] = $blog->category_id ?? null;
        }

        return $data;
    }

    // Format multiple blogs
    public static function formatBlogList(array $blogs): array
    {
        return array_map([self::class, 'formatBlogData'], $blogs);
    }

    /**
     * Generate unique slug from title
     * Uses Helper::generateSlug() for base slug, then ensures uniqueness
     */
    public static function generateSlug($title): string
    {
        $slug = Helper::generateSlug($title);

        // Ensure uniqueness
        $originalSlug = $slug;
        $counter = 1;

        while (Blog::findBySlug($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    // Validate blog data
    public static function validateBlogData(array $data, $isUpdate = false): array
    {
        $errors = [];

        // Title validation
        if (!$isUpdate && empty($data['title'])) {
            $errors['title'] = 'Tiêu đề không được để trống';
        } elseif (isset($data['title']) && strlen($data['title']) > 255) {
            $errors['title'] = 'Tiêu đề không được vượt quá 255 ký tự';
        }

        // Status validation
        if (isset($data['status']) && !in_array($data['status'], ['draft', 'pending', 'published', 'archived'])) {
            $errors['status'] = 'Trạng thái không hợp lệ';
        }

        // Category validation
        if (isset($data['category_id']) && !empty($data['category_id'])) {
            // You can add category existence check here
        }

        return $errors;
    }

    // Generate excerpt from content
    public static function generateExcerpt($content, $length = 200): string
    {
        // Strip HTML tags
        $text = strip_tags($content);
        
        // Trim to length
        if (strlen($text) > $length) {
            $text = substr($text, 0, $length);
            $text = substr($text, 0, strrpos($text, ' ')) . '...';
        }
        
        return $text;
    }
}
