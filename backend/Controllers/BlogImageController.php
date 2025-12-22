<?php
/**
 * Blog Image Upload Controller
 * Handles uploading featured and inline images for blogs
 */

use App\Services\MinioService;
use App\Models\Blog;
use App\Core\RestApi;

require_once __DIR__ . '/../Services/MinioService.php';
require_once __DIR__ . '/../Models/Blog.php';
require_once __DIR__ . '/../Core/RestApi.php';

class BlogImageController
{
    /**
     * POST /api/blogs/{id}/featured-image
     * Upload featured image for a blog post
     */
    public function uploadFeaturedImage()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để upload ảnh', 401);
                return;
            }

            // Get blog ID from path
            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của blog', 400);
                return;
            }

            // Check if blog exists and user owns it
            $blog = Blog::find($id);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            if ($blog->user_id != $userId) {
                RestApi::apiError('Bạn không có quyền upload ảnh cho blog này', 403);
                return;
            }

            // Debug logging
            error_log('DEBUG Featured Image Upload - $_FILES: ' . print_r($_FILES, true));
            error_log('DEBUG Featured Image Upload - Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));

            // Check if file was uploaded
            if (!isset($_FILES['image'])) {
                RestApi::apiError('Không tìm thấy field "image" trong request', 400);
                return;
            }

            if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                $errorMsg = 'Upload thất bại với error code: ' . $_FILES['image']['error'];
                error_log('DEBUG Featured Image Upload - Error: ' . $errorMsg);
                RestApi::apiError($errorMsg, 400);
                return;
            }

            $file = $_FILES['image'];

            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedTypes)) {
                RestApi::apiError('Định dạng file không hợp lệ. Chỉ chấp nhận: JPG, PNG, GIF, WEBP', 400);
                return;
            }

            // Validate file size (max 5MB)
            if ($file['size'] > 5 * 1024 * 1024) {
                RestApi::apiError('File quá lớn. Kích thước tối đa: 5MB', 400);
                return;
            }

            // Read file content
            $fileContent = file_get_contents($file['tmp_name']);
            if ($fileContent === false) {
                RestApi::apiError('Không thể đọc file', 500);
                return;
            }

            // Upload to MinIO with standard name: bl{id}.png
            $minio = new MinioService();
            $imagePath = MinioService::getBlogImagePath($id);
            $uploaded = $minio->uploadContent($imagePath, $fileContent, $mimeType);

            if (!$uploaded) {
                RestApi::apiError('Không thể upload ảnh lên storage', 500);
                return;
            }

            RestApi::apiResponse([
                'url' => $imagePath,
                'message' => 'Upload ảnh đại diện thành công'
            ], 'Upload thành công', true, 200);

        } catch (Exception $e) {
            error_log('Featured image upload error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi upload ảnh', 500);
        }
    }

    /**
     * POST /api/blogs/{id}/images
     * Upload multiple inline images for markdown content
     */
    public function uploadInlineImages()
    {
        try {
            RestApi::setHeaders();

            // Check authentication
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Vui lòng đăng nhập để upload ảnh', 401);
                return;
            }

            // Get blog ID from path
            $id = $_GET['id'] ?? null;
            if (!$id) {
                RestApi::apiError('Vui lòng cung cấp ID của blog', 400);
                return;
            }

            // Check if blog exists and user owns it
            $blog = Blog::find($id);
            if (!$blog) {
                RestApi::apiError('Không tìm thấy blog', 404);
                return;
            }

            if ($blog->user_id != $userId) {
                RestApi::apiError('Bạn không có quyền upload ảnh cho blog này', 403);
                return;
            }

            // Check if files were uploaded
            if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
                RestApi::apiError('Không có file ảnh', 400);
                return;
            }

            $files = $_FILES['images'];
            $uploadedFiles = [];
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $minio = new MinioService();

            // Process each file
            $fileCount = count($files['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                // Check for upload errors
                if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                    continue;
                }

                // Validate file type
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $files['tmp_name'][$i]);
                finfo_close($finfo);

                if (!in_array($mimeType, $allowedTypes)) {
                    continue;
                }

                // Validate file size (max 5MB)
                if ($files['size'][$i] > 5 * 1024 * 1024) {
                    continue;
                }

                // Read file content
                $fileContent = file_get_contents($files['tmp_name'][$i]);
                if ($fileContent === false) {
                    continue;
                }

                // Upload to MinIO with standard name: bl{id}_{n}.png
                $imageNumber = $i + 1;
                $imagePath = "blog/bl{$id}_{$imageNumber}.png";
                $uploaded = $minio->uploadContent($imagePath, $fileContent, $mimeType);

                if ($uploaded) {
                    $uploadedFiles[] = [
                        'index' => $imageNumber,
                        'path' => $imagePath,
                        'original_name' => $files['name'][$i]
                    ];
                }
            }

            if (empty($uploadedFiles)) {
                RestApi::apiError('Không thể upload ảnh nào', 500);
                return;
            }

            RestApi::apiResponse([
                'uploaded' => count($uploadedFiles),
                'files' => $uploadedFiles
            ], 'Upload ảnh nội dung thành công', true, 200);

        } catch (Exception $e) {
            error_log('Inline images upload error: ' . $e->getMessage());
            RestApi::apiError('Đã xảy ra lỗi khi upload ảnh', 500);
        }
    }
}

