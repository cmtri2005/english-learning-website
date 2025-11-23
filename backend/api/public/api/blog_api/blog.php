<?php
// Blog API endpoints
// Headers already set in index.php
// Auth, Response, and Database classes already loaded

$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Helper function to get JSON body
function getJsonBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

// Helper function to generate slug from title
function generateSlug($title) {
    $slug = strtolower(trim($title));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    return trim($slug, '-');
}

try {
    $pdo = Database::getInstance()->getConnection();

    // GET /api/blog/categories - Get all categories (MUST be before single post route)
    if ($path === '/api/blog/categories' && $method === 'GET') {
        $stmt = $pdo->query("
            SELECT 
                category,
                COUNT(*) as count
            FROM blog_posts
            WHERE is_published = 1
            GROUP BY category
            ORDER BY count DESC
        ");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($categories);
    }

    // GET /api/blog - List blog posts (public)
    if ($path === '/api/blog' && $method === 'GET') {
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 10;
        $offset = ($page - 1) * $limit;
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        $featured = isset($_GET['featured']) ? intval($_GET['featured']) : null;

        $where = ["is_published = 1"];
        $params = [];

        if ($category) {
            $where[] = "category = ?";
            $params[] = $category;
        }

        if ($search) {
            $where[] = "(title LIKE ? OR content LIKE ? OR excerpt LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($featured !== null) {
            $where[] = "is_featured = ?";
            $params[] = $featured;
        }

        $whereClause = implode(' AND ', $where);

        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM blog_posts WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        // Get posts
        $sql = "
            SELECT 
                bp.id,
                bp.title,
                bp.slug,
                bp.excerpt,
                bp.category,
                bp.featured_image,
                bp.views,
                bp.is_featured,
                bp.created_at,
                bp.updated_at,
                u.id as author_id,
                u.name as author_name,
                u.avatar as author_avatar,
                (SELECT COUNT(*) FROM blog_likes WHERE post_id = bp.id) as likes_count,
                (SELECT COUNT(*) FROM blog_comments WHERE post_id = bp.id AND is_approved = 1) as comments_count
            FROM blog_posts bp
            INNER JOIN users u ON bp.user_id = u.id
            WHERE {$whereClause}
            ORDER BY bp.is_featured DESC, bp.created_at DESC
            LIMIT ? OFFSET ?
        ";

        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'posts' => $posts,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => intval($total),
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    // GET /api/blog/:id or /api/blog/:slug - Get single post
    if (preg_match('#^/api/blog/([^/]+)$#', $path, $matches) && $method === 'GET') {
        $identifier = $matches[1];
        $isNumeric = is_numeric($identifier);

        $sql = "
            SELECT 
                bp.*,
                u.id as author_id,
                u.name as author_name,
                u.avatar as author_avatar,
                (SELECT COUNT(*) FROM blog_likes WHERE post_id = bp.id) as likes_count,
                (SELECT COUNT(*) FROM blog_comments WHERE post_id = bp.id AND is_approved = 1) as comments_count
            FROM blog_posts bp
            INNER JOIN users u ON bp.user_id = u.id
            WHERE " . ($isNumeric ? "bp.id = ?" : "bp.slug = ?") . " AND bp.is_published = 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$identifier]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            Response::notFound('Blog post not found');
        }

        // Increment views
        $updateStmt = $pdo->prepare("UPDATE blog_posts SET views = views + 1 WHERE id = ?");
        $updateStmt->execute([$post['id']]);
        $post['views'] = intval($post['views']) + 1;

        // Get comments
        $commentsStmt = $pdo->prepare("
            SELECT 
                bc.*,
                u.name as author_name,
                u.avatar as author_avatar
            FROM blog_comments bc
            INNER JOIN users u ON bc.user_id = u.id
            WHERE bc.post_id = ? AND bc.is_approved = 1
            ORDER BY bc.created_at ASC
        ");
        $commentsStmt->execute([$post['id']]);
        $post['comments'] = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if current user liked this post
        $currentUser = $auth->getCurrentUser();
        if ($currentUser) {
            $likeStmt = $pdo->prepare("SELECT id FROM blog_likes WHERE post_id = ? AND user_id = ?");
            $likeStmt->execute([$post['id'], $currentUser['id']]);
            $post['is_liked'] = $likeStmt->fetch() !== false;
        } else {
            $post['is_liked'] = false;
        }
        
        // Convert numeric strings to integers
        $post['id'] = intval($post['id']);
        $post['user_id'] = intval($post['user_id']);
        $post['views'] = intval($post['views']);
        $post['likes_count'] = intval($post['likes_count']);
        $post['comments_count'] = intval($post['comments_count']);

        Response::success($post);
    }

    // POST /api/blog - Create new post (authenticated)
    if ($path === '/api/blog' && $method === 'POST') {
        $currentUser = $auth->requireAuth();
        $data = getJsonBody();

        $title = trim($data['title'] ?? '');
        $content = trim($data['content'] ?? '');
        $excerpt = trim($data['excerpt'] ?? '');
        $category = trim($data['category'] ?? 'General');
        $featuredImage = trim($data['featured_image'] ?? '');

        if (empty($title) || empty($content)) {
            Response::validationError('Title and content are required', [
                'title' => empty($title) ? 'Title is required' : null,
                'content' => empty($content) ? 'Content is required' : null
            ]);
        }

        $slug = generateSlug($title);
        
        // Ensure slug is unique
        $slugCheck = $pdo->prepare("SELECT id FROM blog_posts WHERE slug = ?");
        $slugCheck->execute([$slug]);
        if ($slugCheck->fetch()) {
            $slug .= '-' . time();
        }

        $stmt = $pdo->prepare("
            INSERT INTO blog_posts (user_id, title, slug, content, excerpt, category, featured_image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $currentUser['id'],
            $title,
            $slug,
            $content,
            $excerpt ?: substr(strip_tags($content), 0, 200),
            $category,
            $featuredImage
        ]);

        $postId = $pdo->lastInsertId();

        // Get created post
        $getStmt = $pdo->prepare("
            SELECT 
                bp.*,
                u.name as author_name,
                u.avatar as author_avatar
            FROM blog_posts bp
            INNER JOIN users u ON bp.user_id = u.id
            WHERE bp.id = ?
        ");
        $getStmt->execute([$postId]);
        $post = $getStmt->fetch(PDO::FETCH_ASSOC);

        Response::success($post, 'Blog post created successfully');
    }

    // PUT /api/blog/:id - Update post (author or admin only)
    if (preg_match('#^/api/blog/(\d+)$#', $path, $matches) && $method === 'PUT') {
        $currentUser = $auth->requireAuth();
        $postId = $matches[1];
        $data = getJsonBody();

        // Check if post exists and user has permission
        $checkStmt = $pdo->prepare("SELECT user_id FROM blog_posts WHERE id = ?");
        $checkStmt->execute([$postId]);
        $post = $checkStmt->fetch();

        if (!$post) {
            Response::notFound('Blog post not found');
        }

        if ($post['user_id'] != $currentUser['id'] && $currentUser['role'] !== 'admin') {
            Response::forbidden('You can only edit your own posts');
        }

        $updates = [];
        $params = [];

        if (isset($data['title'])) {
            $updates[] = "title = ?";
            $params[] = trim($data['title']);
            
            // Update slug if title changed
            $newSlug = generateSlug($data['title']);
            $slugCheck = $pdo->prepare("SELECT id FROM blog_posts WHERE slug = ? AND id != ?");
            $slugCheck->execute([$newSlug, $postId]);
            if (!$slugCheck->fetch()) {
                $updates[] = "slug = ?";
                $params[] = $newSlug;
            }
        }

        if (isset($data['content'])) {
            $updates[] = "content = ?";
            $params[] = trim($data['content']);
        }

        if (isset($data['excerpt'])) {
            $updates[] = "excerpt = ?";
            $params[] = trim($data['excerpt']);
        }

        if (isset($data['category'])) {
            $updates[] = "category = ?";
            $params[] = trim($data['category']);
        }

        if (isset($data['featured_image'])) {
            $updates[] = "featured_image = ?";
            $params[] = trim($data['featured_image']);
        }

        if (isset($data['is_published']) && $currentUser['role'] === 'admin') {
            $updates[] = "is_published = ?";
            $params[] = intval($data['is_published']);
        }

        if (isset($data['is_featured']) && $currentUser['role'] === 'admin') {
            $updates[] = "is_featured = ?";
            $params[] = intval($data['is_featured']);
        }

        if (empty($updates)) {
            Response::error('No fields to update');
        }

        $params[] = $postId;
        $sql = "UPDATE blog_posts SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Get updated post
        $getStmt = $pdo->prepare("
            SELECT 
                bp.*,
                u.name as author_name,
                u.avatar as author_avatar
            FROM blog_posts bp
            INNER JOIN users u ON bp.user_id = u.id
            WHERE bp.id = ?
        ");
        $getStmt->execute([$postId]);
        $updatedPost = $getStmt->fetch(PDO::FETCH_ASSOC);

        Response::success($updatedPost, 'Blog post updated successfully');
    }

    // DELETE /api/blog/:id - Delete post (author or admin only)
    if (preg_match('#^/api/blog/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        $currentUser = $auth->requireAuth();
        $postId = $matches[1];

        $checkStmt = $pdo->prepare("SELECT user_id FROM blog_posts WHERE id = ?");
        $checkStmt->execute([$postId]);
        $post = $checkStmt->fetch();

        if (!$post) {
            Response::notFound('Blog post not found');
        }

        if ($post['user_id'] != $currentUser['id'] && $currentUser['role'] !== 'admin') {
            Response::forbidden('You can only delete your own posts');
        }

        $stmt = $pdo->prepare("DELETE FROM blog_posts WHERE id = ?");
        $stmt->execute([$postId]);

        Response::success(null, 'Blog post deleted successfully');
    }

    // POST /api/blog/:id/like - Toggle like
    if (preg_match('#^/api/blog/(\d+)/like$#', $path, $matches) && $method === 'POST') {
        $currentUser = $auth->requireAuth();
        $postId = $matches[1];

        // Check if post exists
        $checkStmt = $pdo->prepare("SELECT id FROM blog_posts WHERE id = ?");
        $checkStmt->execute([$postId]);
        if (!$checkStmt->fetch()) {
            Response::notFound('Blog post not found');
        }

        // Check if already liked
        $likeStmt = $pdo->prepare("SELECT id FROM blog_likes WHERE post_id = ? AND user_id = ?");
        $likeStmt->execute([$postId, $currentUser['id']]);
        $existingLike = $likeStmt->fetch();

        if ($existingLike) {
            // Unlike
            $deleteStmt = $pdo->prepare("DELETE FROM blog_likes WHERE post_id = ? AND user_id = ?");
            $deleteStmt->execute([$postId, $currentUser['id']]);
            $liked = false;
        } else {
            // Like
            $insertStmt = $pdo->prepare("INSERT INTO blog_likes (post_id, user_id) VALUES (?, ?)");
            $insertStmt->execute([$postId, $currentUser['id']]);
            $liked = true;
        }

        // Get updated like count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM blog_likes WHERE post_id = ?");
        $countStmt->execute([$postId]);
        $likeCount = $countStmt->fetch()['count'];

        Response::success([
            'liked' => $liked,
            'likes_count' => intval($likeCount)
        ]);
    }

    // POST /api/blog/:id/comments - Add comment
    if (preg_match('#^/api/blog/(\d+)/comments$#', $path, $matches) && $method === 'POST') {
        $currentUser = $auth->requireAuth();
        $postId = $matches[1];
        $data = getJsonBody();

        $content = trim($data['content'] ?? '');
        $parentId = isset($data['parent_id']) ? intval($data['parent_id']) : null;

        if (empty($content)) {
            Response::validationError('Comment content is required', [
                'content' => 'Comment content is required'
            ]);
        }

        // Check if post exists
        $checkStmt = $pdo->prepare("SELECT id FROM blog_posts WHERE id = ?");
        $checkStmt->execute([$postId]);
        if (!$checkStmt->fetch()) {
            Response::notFound('Blog post not found');
        }

        $stmt = $pdo->prepare("
            INSERT INTO blog_comments (post_id, user_id, parent_id, content)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$postId, $currentUser['id'], $parentId, $content]);

        $commentId = $pdo->lastInsertId();

        // Get created comment
        $getStmt = $pdo->prepare("
            SELECT 
                bc.*,
                u.name as author_name,
                u.avatar as author_avatar
            FROM blog_comments bc
            INNER JOIN users u ON bc.user_id = u.id
            WHERE bc.id = ?
        ");
        $getStmt->execute([$commentId]);
        $comment = $getStmt->fetch(PDO::FETCH_ASSOC);

        Response::success($comment, 'Comment added successfully');
    }

    // No route matched
    Response::notFound('Blog endpoint not found');
    
} catch (Exception $e) {
    error_log("Blog API Error: " . $e->getMessage());
    Response::serverError($e->getMessage());
}

