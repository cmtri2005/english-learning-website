<?php

namespace App\Controllers;

use App\Core\RestApi;
use App\Models\Comment;
use App\Models\Blog;
use App\Services\CommentService;
use Exception;

class CommentController
{

    /**
     * GET /api/comments - Get comments for a blog
     */
    public function index()
    {
        try {
            RestApi::setHeaders();

            $blogId = $_GET['blog_id'] ?? null;
            if (!$blogId) {
                RestApi::apiError('Vui lòng cung cấp blog_id', 400);
                return;
            }

            // Verify blog exists
            $blog = Blog::find($blogId);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 20;

            $result = Comment::getByBlogId($blogId, $page, $perPage);

            // Format comments
            $formattedComments = CommentService::formatCommentList($result['data']);

            RestApi::apiResponse([
                'comments' => $formattedComments,
                'pagination' => [
                    'current_page' => $result['current_page'],
                    'per_page' => $result['per_page'],
                    'total' => $result['total'],
                    'last_page' => $result['last_page']
                ]
            ], 'Lấy danh sách bình luận thành công');

        } catch (Exception $e) {
            error_log('Comments index error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi lấy danh sách bình luận', 500);
        }
    }

    /**
     * POST /api/comments - Create comment
     */
    public function create()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để bình luận', 401);
                return;
            }

            $body = RestApi::getBody();

            // Validate
            $blogId = $body['blog_id'] ?? null;
            $content = trim($body['content'] ?? '');

            if (!$blogId) {
                RestApi::apiError('Vui lòng cung cấp blog_id', 400);
                return;
            }

            if (empty($content)) {
                RestApi::apiError('Nội dung bình luận không được để trống', 400);
                return;
            }

            if (strlen($content) > 5000) {
                RestApi::apiError('Nội dung bình luận không được vượt quá 5000 ký tự', 400);
                return;
            }

            // Verify blog exists
            $blog = Blog::find($blogId);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            // Create comment
            $comment = Comment::create([
                'blog_id' => $blogId,
                'user_id' => $userId,
                'content' => $content
            ]);

            if (!$comment) {
                RestApi::apiError('Không thể tạo bình luận', 500);
                return;
            }

            // Get comment with author info
            $fullComment = Comment::getWithAuthor($comment->comment_id);

            RestApi::apiResponse(
                CommentService::formatComment($fullComment),
                'Thêm bình luận thành công',
                true,
                201
            );

        } catch (Exception $e) {
            error_log('Comment create error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi thêm bình luận', 500);
        }
    }

    /**
     * PUT /api/comments - Update comment
     */
    public function update()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập', 401);
                return;
            }

            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của bình luận', 400);
                return;
            }

            $comment = Comment::find($id);
            if (!$comment) {
                RestApi::apiError('Không tìm thấy bình luận', 404);
                return;
            }

            // Check ownership
            if ($comment->user_id != $userId) {
                RestApi::apiError('Bạn không có quyền chỉnh sửa bình luận này', 403);
                return;
            }

            $body = RestApi::getBody();
            $content = trim($body['content'] ?? '');

            if (empty($content)) {
                RestApi::apiError('Nội dung bình luận không được để trống', 400);
                return;
            }

            if (strlen($content) > 5000) {
                RestApi::apiError('Nội dung bình luận không được vượt quá 5000 ký tự', 400);
                return;
            }

            // Update with history (saves old content)
            $comment->updateWithHistory($content);

            // Get updated comment
            $updatedComment = Comment::getWithAuthor($id);

            RestApi::apiResponse(
                CommentService::formatComment($updatedComment),
                'Cập nhật bình luận thành công'
            );

        } catch (Exception $e) {
            error_log('Comment update error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi cập nhật bình luận', 500);
        }
    }

    /**
     * DELETE /api/comments - Delete comment
     */
    public function delete()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập', 401);
                return;
            }

            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của bình luận', 400);
                return;
            }

            $comment = Comment::find($id);
            if (!$comment) {
                RestApi::apiError('Không tìm thấy bình luận', 404);
                return;
            }

            // Check ownership (TODO: also allow blog owner and admin)
            if ($comment->user_id != $userId) {
                RestApi::apiError('Bạn không có quyền xóa bình luận này', 403);
                return;
            }

            Comment::delete($id);

            RestApi::apiResponse(null, 'Xóa bình luận thành công');

        } catch (Exception $e) {
            error_log('Comment delete error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi xóa bình luận', 500);
        }
    }
}
