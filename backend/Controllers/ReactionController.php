<?php

namespace App\Controllers;

use App\Core\RestApi;
use App\Models\Reaction;
use App\Models\Blog;
use App\Models\Comment;
use Exception;

class ReactionController
{

    /**
     * POST /api/reactions - Toggle reaction on blog or comment
     * 
     * Body:
     * - blog_id OR comment_id (one required)
     * - reaction_type: 'like' | 'love' (default: 'like')
     */
    public function toggle()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để thực hiện thao tác này', 401);
                return;
            }

            $body = RestApi::getBody();

            $blogId = $body['blog_id'] ?? null;
            $commentId = $body['comment_id'] ?? null;

            // Must provide either blog_id or comment_id
            if (!$blogId && !$commentId) {
                RestApi::apiError('Vui lòng cung cấp blog_id hoặc comment_id', 400);
                return;
            }

            // Cannot provide both
            if ($blogId && $commentId) {
                RestApi::apiError('Chỉ được cung cấp blog_id hoặc comment_id, không được cả hai', 400);
                return;
            }

            $result = null;
            $targetType = null;

            if ($blogId) {
                // Verify blog exists
                $blog = Blog::find($blogId);
                if (!$blog) {
                    RestApi::apiError('Không tìm thấy blog', 404);
                    return;
                }

                $result = Reaction::toggleBlogReaction($userId, $blogId);
                $targetType = 'blog';

            } else {
                // Verify comment exists
                $comment = Comment::find($commentId);
                if (!$comment) {
                    RestApi::apiError('Không tìm thấy bình luận', 404);
                    return;
                }

                $result = Reaction::toggleCommentReaction($userId, $commentId);
                $targetType = 'comment';
            }

            $message = $result['action'] === 'added' ? 'Đã thích' : 'Đã bỏ thích';

            RestApi::apiResponse([
                'action' => $result['action'],
                'has_reacted' => $result['has_reacted'],
                'count' => $result['count'],
                'target_type' => $targetType
            ], $message);

        } catch (Exception $e) {
            error_log('Reaction toggle error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi thực hiện thao tác', 500);
        }
    }

    /**
     * GET /api/reactions - Get reaction info for blog or comment
     */
    public function show()
    {
        try {
            RestApi::setHeaders();

            $blogId = $_GET['blog_id'] ?? null;
            $commentId = $_GET['comment_id'] ?? null;

            if (!$blogId && !$commentId) {
                RestApi::apiError('Vui lòng cung cấp blog_id hoặc comment_id', 400);
                return;
            }

            $userId = RestApi::getCurrentUserId();
            $response = [];

            if ($blogId) {
                $response['count'] = Reaction::getCountByBlog($blogId);
                if ($userId) {
                    $response['has_reacted'] = Reaction::getUserReactionForBlog($userId, $blogId);
                }
            } else {
                $response['count'] = Reaction::getCountByComment($commentId);
                if ($userId) {
                    $response['has_reacted'] = Reaction::getUserReactionForComment($userId, $commentId);
                }
            }

            RestApi::apiResponse($response, 'Lấy thông tin reaction thành công');

        } catch (Exception $e) {
            error_log('Reaction show error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi', 500);
        }
    }
}
