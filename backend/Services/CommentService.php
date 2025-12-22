<?php

namespace App\Services;

/**
 * CommentService - Xử lý logic liên quan đến comments
 */
class CommentService
{
    /**
     * Format comment data for API response
     * @param object $comment Comment model object
     * @return array Formatted comment data
     */
    public static function formatComment($comment): array
    {
        if (!$comment) {
            return [];
        }

        return [
            'id' => $comment->comment_id ?? null,
            'blog_id' => $comment->blog_id ?? null,
            'user_id' => $comment->user_id ?? null,
            'content' => $comment->content ?? '',
            'old_content' => $comment->old_content ?? null,
            'created_at' => $comment->created_at ?? null,
            'updated_at' => $comment->updated_at ?? null,
            'author' => [
                'id' => $comment->user_id ?? null,
                'name' => $comment->author_name ?? '',
                'avatar' => $comment->author_avatar ?? null
            ],
            'likes_count' => (int) ($comment->likes_count ?? 0),
            'user_reaction' => $comment->user_reaction ?? null
        ];
    }

    /**
     * Format multiple comments
     * @param array $comments Array of comment objects
     * @return array Formatted comments
     */
    public static function formatCommentList(array $comments): array
    {
        return array_map([self::class, 'formatComment'], $comments);
    }

    /**
     * Validate comment data
     * @param array $data Comment data to validate
     * @param bool $isUpdate Whether this is an update operation
     * @return array Validation errors (empty if valid)
     */
    public static function validateComment(array $data, bool $isUpdate = false): array
    {
        $errors = [];

        // Blog ID validation (required for create)
        if (!$isUpdate && empty($data['blog_id'])) {
            $errors['blog_id'] = 'Vui lòng cung cấp blog_id';
        }

        // Content validation
        $content = trim($data['content'] ?? '');
        if (empty($content)) {
            $errors['content'] = 'Nội dung bình luận không được để trống';
        } elseif (strlen($content) > 5000) {
            $errors['content'] = 'Nội dung bình luận không được vượt quá 5000 ký tự';
        }

        return $errors;
    }
}
