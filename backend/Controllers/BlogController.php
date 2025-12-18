<?php

namespace App\Controllers;

use App\Core\RestApi;
use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Models\Reaction;
use App\Services\BlogService;
use App\Services\MinioService;
use Exception;

class BlogController
{
    /**
     * GET /api/blogs - List blogs with pagination and filters
     */
    public function index()
    {
        try {
            RestApi::setHeaders();

            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 10;
            $categorySlug = $_GET['category'] ?? null;
            $tagSlug = $_GET['tag'] ?? null;
            $search = $_GET['search'] ?? null;
            $status = $_GET['status'] ?? 'published';

            // Get category ID from slug
            $categoryId = null;
            if ($categorySlug) {
                $category = BlogCategory::findBySlug($categorySlug);
                $categoryId = $category ? $category->category_id : null;
            }

            // Get tag ID from slug
            $tagId = null;
            if ($tagSlug) {
                $tag = BlogTag::findBySlug($tagSlug);
                $tagId = $tag ? $tag->tag_id : null;
            }

            $result = Blog::getPaginated($page, $perPage, $categoryId, $tagId, $search, $status);

            // Format blogs
            $formattedBlogs = BlogService::formatBlogList($result['data']);

            // Add tags to each blog
            foreach ($formattedBlogs as &$blog) {
                $tags = BlogTag::getByBlogId($blog['id']);
                $blog['tags'] = array_map(function ($tag) {
                    return [
                        'id' => $tag->tag_id,
                        'name' => $tag->name,
                        'slug' => $tag->slug
                    ];
                }, $tags);
            }

            RestApi::apiResponse([
                'blogs' => $formattedBlogs,
                'pagination' => [
                    'current_page' => $result['current_page'],
                    'per_page' => $result['per_page'],
                    'total' => $result['total'],
                    'last_page' => $result['last_page']
                ]
            ], 'Lấy danh sách blog thành công');

        } catch (Exception $e) {
            error_log('Blog index error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi lấy danh sách blog', 500);
        }
    }

    /**
     * GET /api/blogs/show - Get single blog by ID or slug
     */
    public function show()
    {
        try {
            RestApi::setHeaders();

            $id = $_GET['id'] ?? null;
            $slug = $_GET['slug'] ?? null;

            if (!$id && !$slug) {
                RestApi::apiError('Vui lòng cung cấp ID hoặc slug của blog', 400);
                return;
            }

            $blog = null;
            if ($slug) {
                $blog = Blog::getBySlugWithDetails($slug);
            } elseif ($id) {
                $blog = Blog::getByIdWithDetails($id);
            }

            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            // Increment view count
            $blog->incrementViews();

            // Format blog
            $formattedBlog = BlogService::formatBlogData($blog);

            // Add tags
            $tags = BlogTag::getByBlogId($blog->blog_id);
            $formattedBlog['tags'] = array_map(function ($tag) {
                return [
                    'id' => $tag->tag_id,
                    'name' => $tag->name,
                    'slug' => $tag->slug
                ];
            }, $tags);

            // Add user reaction if logged in
            $userId = RestApi::getCurrentUserId();
            if ($userId) {
                $formattedBlog['has_reacted'] = Reaction::getUserReactionForBlog($userId, $blog->blog_id);
            }

            RestApi::apiResponse($formattedBlog, 'Lấy thông tin blog thành công');

        } catch (Exception $e) {
            error_log('Blog show error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi lấy thông tin blog', 500);
        }
    }

    /**
     * POST /api/blogs - Create new blog
     */
    public function create()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để tạo blog', 401);
                return;
            }

            $body = RestApi::getBody();

            // Validate
            $errors = BlogService::validateBlogData($body);
            if (!empty($errors)) {
                RestApi::apiError(array_values($errors)[0], 400);
                return;
            }

            // Generate slug
            $slug = BlogService::generateSlug($body['title']);

            // Generate excerpt if not provided
            $excerpt = $body['excerpt'] ?? BlogService::generateExcerpt($body['content']);

            // Create blog
            $blog = Blog::create([
                'user_id' => $userId,
                'category_id' => $body['category_id'] ?? null,
                'title' => $body['title'],
                'slug' => $slug,
                'excerpt' => $excerpt,
                'status' => $body['status'] ?? 'draft',
                'meta_title' => $body['meta_title'] ?? $body['title'],
                'meta_description' => $body['meta_description'] ?? $excerpt,
                'view_count' => 0
            ]);

            if (!$blog) {
                RestApi::apiError('Không thể tạo blog', 500);
                return;
            }

            // Attach tags if provided
            if (isset($body['tags']) && is_array($body['tags'])) {
                BlogTag::syncBlogTags($blog->blog_id, $body['tags']);
            }

            // Upload content to MinIO if provided
            if (isset($body['content']) && !empty($body['content'])) {
                $minio = new MinioService();
                $contentPath = MinioService::getBlogContentPath($blog->blog_id);
                $uploaded = $minio->uploadContent($contentPath, $body['content'], 'text/markdown');
                if (!$uploaded) {
                    error_log("Failed to upload blog content to MinIO for blog {$blog->blog_id}");
                }
            }

            // Get full blog data
            $fullBlog = Blog::getByIdWithDetails($blog->blog_id);
            $formattedBlog = BlogService::formatBlogData($fullBlog);
            $formattedBlog['tags'] = BlogTag::getByBlogId($blog->blog_id);

            RestApi::apiResponse($formattedBlog, 'Tạo blog thành công', true, 201);

        } catch (Exception $e) {
            error_log('Blog create error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi tạo blog', 500);
        }
    }

    /**
     * PUT /api/blogs - Update blog
     */
    public function update()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để cập nhật blog', 401);
                return;
            }

            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của blog', 400);
                return;
            }

            $blog = Blog::find($id);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            // Check ownership
            if ($blog->user_id != $userId) {
                RestApi::apiError('Bạn không có quyền cập nhật blog này', 403);
                return;
            }

            $body = RestApi::getBody();

            // Validate
            $errors = BlogService::validateBlogData($body, true);
            if (!empty($errors)) {
                RestApi::apiError(array_values($errors)[0], 400);
                return;
            }

            // Prepare update data
            $updateData = [];
            if (isset($body['title'])) {
                $updateData['title'] = $body['title'];
                // Regenerate slug if title changed
                if ($body['title'] !== $blog->title) {
                    $updateData['slug'] = BlogService::generateSlug($body['title']);
                }
            }
            if (isset($body['excerpt'])) $updateData['excerpt'] = $body['excerpt'];
            if (isset($body['category_id'])) $updateData['category_id'] = $body['category_id'];
            if (isset($body['status'])) $updateData['status'] = $body['status'];
            if (isset($body['meta_title'])) $updateData['meta_title'] = $body['meta_title'];
            if (isset($body['meta_description'])) $updateData['meta_description'] = $body['meta_description'];

            if (!empty($updateData)) {
                Blog::update($id, $updateData);
            }

            // Sync tags if provided
            if (isset($body['tags']) && is_array($body['tags'])) {
                BlogTag::syncBlogTags($id, $body['tags']);
            }

            // Upload content to MinIO if provided
            error_log("DEBUG: Checking for content in body. Content isset: " . (isset($body['content']) ? 'yes' : 'no'));
            if (isset($body['content'])) {
                error_log("DEBUG: Content length: " . strlen($body['content']));
            }
            if (isset($body['content']) && !empty($body['content'])) {
                error_log("DEBUG: Uploading content to MinIO for blog {$id}");
                $minio = new MinioService();
                $contentPath = MinioService::getBlogContentPath((int)$id);
                $uploaded = $minio->uploadContent($contentPath, $body['content'], 'text/markdown');
                if (!$uploaded) {
                    error_log("Failed to upload blog content to MinIO for blog {$id}");
                } else {
                    error_log("DEBUG: Successfully uploaded content to MinIO for blog {$id}");
                }
            }

            // Get updated blog
            $updatedBlog = Blog::getByIdWithDetails($id);
            $formattedBlog = BlogService::formatBlogData($updatedBlog);
            $formattedBlog['tags'] = BlogTag::getByBlogId($id);

            RestApi::apiResponse($formattedBlog, 'Cập nhật blog thành công');

        } catch (Exception $e) {
            error_log('Blog update error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi cập nhật blog', 500);
        }
    }

    /**
     * DELETE /api/blogs - Delete blog
     */
    public function delete()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để xóa blog', 401);
                return;
            }

            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của blog', 400);
                return;
            }

            $blog = Blog::find($id);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            // Check ownership (TODO: also allow admin)
            if ($blog->user_id != $userId) {
                RestApi::apiError('Bạn không có quyền xóa blog này', 403);
                return;
            }

            // Delete blog (cascades to comments, reactions, tags via FK)
            Blog::delete($id);

            RestApi::apiResponse(null, 'Xóa blog thành công');

        } catch (Exception $e) {
            error_log('Blog delete error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi xóa blog', 500);
        }
    }

    /**
     * GET /api/blogs/my-blogs - Get current user's blogs
     */
    public function myBlogs()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập', 401);
                return;
            }

            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 10;
            $status = $_GET['status'] ?? null; // Allow all statuses for owner

            $result = Blog::getPaginated($page, $perPage, null, null, null, $status, $userId);

            // Format blogs
            $formattedBlogs = BlogService::formatBlogList($result['data']);

            RestApi::apiResponse([
                'blogs' => $formattedBlogs,
                'pagination' => [
                    'current_page' => $result['current_page'],
                    'per_page' => $result['per_page'],
                    'total' => $result['total'],
                    'last_page' => $result['last_page']
                ]
            ], 'Lấy danh sách blog của bạn thành công');

        } catch (Exception $e) {
            error_log('My blogs error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi', 500);
        }
    }

    /**
     * GET /api/blogs/category - Get blogs by category slug
     */
    public function byCategory()
    {
        try {
            RestApi::setHeaders();

            $slug = $_GET['slug'] ?? null;
            if (!$slug) {
                RestApi::apiError('Vui lòng cung cấp slug của danh mục', 400);
                return;
            }

            $category = BlogCategory::findBySlug($slug);
            if (!$category) {
                RestApi::apiError('Không tìm thấy danh mục', 404);
                return;
            }

            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 10;

            $result = Blog::getPaginated($page, $perPage, $category->category_id);
            $formattedBlogs = BlogService::formatBlogList($result['data']);

            RestApi::apiResponse([
                'category' => [
                    'id' => $category->category_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description
                ],
                'blogs' => $formattedBlogs,
                'pagination' => [
                    'current_page' => $result['current_page'],
                    'per_page' => $result['per_page'],
                    'total' => $result['total'],
                    'last_page' => $result['last_page']
                ]
            ], 'Lấy danh sách blog theo danh mục thành công');

        } catch (Exception $e) {
            error_log('Blogs by category error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi', 500);
        }
    }

    /**
     * GET /api/blogs/tag - Get blogs by tag slug
     */
    public function byTag()
    {
        try {
            RestApi::setHeaders();

            $slug = $_GET['slug'] ?? null;
            if (!$slug) {
                RestApi::apiError('Vui lòng cung cấp slug của tag', 400);
                return;
            }

            $tag = BlogTag::findBySlug($slug);
            if (!$tag) {
                RestApi::apiError('Không tìm thấy tag', 404);
                return;
            }

            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 10;

            $result = Blog::getPaginated($page, $perPage, null, $tag->tag_id);
            $formattedBlogs = BlogService::formatBlogList($result['data']);

            RestApi::apiResponse([
                'tag' => [
                    'id' => $tag->tag_id,
                    'name' => $tag->name,
                    'slug' => $tag->slug
                ],
                'blogs' => $formattedBlogs,
                'pagination' => [
                    'current_page' => $result['current_page'],
                    'per_page' => $result['per_page'],
                    'total' => $result['total'],
                    'last_page' => $result['last_page']
                ]
            ], 'Lấy danh sách blog theo tag thành công');

        } catch (Exception $e) {
            error_log('Blogs by tag error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi', 500);
        }
    }

    /**
     * GET /api/blog-categories - Get all categories
     */
    public function getCategories()
    {
        try {
            RestApi::setHeaders();

            $categories = BlogCategory::getAllWithBlogCount();

            $formattedCategories = array_map(function ($cat) {
                return [
                    'id' => $cat->category_id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'description' => $cat->description,
                    'blog_count' => (int) $cat->blog_count
                ];
            }, $categories);

            RestApi::apiResponse($formattedCategories, 'Lấy danh sách danh mục thành công');

        } catch (Exception $e) {
            error_log('Get categories error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi', 500);
        }
    }

    /**
     * GET /api/blog-tags - Get all tags
     */
    public function getTags()
    {
        try {
            RestApi::setHeaders();

            $tags = BlogTag::getAllWithBlogCount();

            $formattedTags = array_map(function ($tag) {
                return [
                    'id' => $tag->tag_id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                    'blog_count' => (int) $tag->blog_count
                ];
            }, $tags);

            RestApi::apiResponse($formattedTags, 'Lấy danh sách tag thành công');

        } catch (Exception $e) {
            error_log('Get tags error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi', 500);
        }
    }

    /**
     * GET /api/blogs/content - Get blog content from MinIO
     */
    public function getContent()
    {
        try {
            RestApi::setHeaders();

            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của blog', 400);
                return;
            }

            // Check blog exists
            $blog = Blog::find($id);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            // Fetch content from MinIO
            $minio = new MinioService();
            $contentPath = MinioService::getBlogContentPath((int)$id);
            $content = $minio->getContent($contentPath);

            if ($content === null) {
                // Return empty content if not found in MinIO
                RestApi::apiResponse(['content' => ''], 'Blog chưa có nội dung');
                return;
            }

            RestApi::apiResponse(['content' => $content], 'Lấy nội dung blog thành công');

        } catch (Exception $e) {
            error_log('Get blog content error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi lấy nội dung blog', 500);
        }
    }
}
