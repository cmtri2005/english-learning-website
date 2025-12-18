# Commit Messages cho Blog Feature (3 commits)

## Commit 1: Backend Implementation
```bash
git add db/init/01_init.sql db/init/02_insert_users.sql db/init/03_insert_blogs.sql
git add backend/Models/Blog.php backend/Models/BlogCategory.php backend/Models/BlogTag.php backend/Models/Comment.php backend/Models/Reaction.php
git add backend/Services/BlogService.php backend/Services/CommentService.php backend/Services/MinioService.php
git add backend/Controllers/BlogController.php backend/Controllers/BlogImageController.php backend/Controllers/CommentController.php backend/Controllers/ReactionController.php
git add backend/Routes/blog.php

git commit -m "feat(blog): implement backend API for blog system

- Add database schema (blogs, categories, tags, comments, reactions)
- Create models: Blog, BlogCategory, BlogTag, Comment, Reaction
- Implement services: BlogService, CommentService, MinioService
- Add controllers: BlogController, BlogImageController, CommentController, ReactionController
- Set up API routes for blog operations
- Add seed data for blogs, comments, and reactions"
```

## Commit 2: Frontend Components & Features
```bash
git add frontend/src/services/blog/
git add frontend/src/services/storage/
git add frontend/src/pages/Blog/hooks/
git add frontend/src/pages/Blog/components/
git add frontend/src/pages/Blog/index.tsx
git add frontend/src/routers/routes.tsx

git commit -m "feat(blog): implement frontend blog system

- Add blog API service layer and TypeScript types
- Create storage service for MinIO URL generation
- Implement custom hooks: useBlogEditor, useBlogDetail, useReactions, useBlogFilters
- Add components: BlogList, BlogCard, BlogDetail, BlogEditor, MarkdownEditor, MarkdownRenderer
- Implement comment system with CommentSection and CommentItem
- Add reaction system with ReactionButton component
- Support featured and inline image uploads
- Add filter sidebar for categories and tags"
```

## Commit 3: Fixes & Improvements
```bash
git add frontend/src/services/api.ts
git add frontend/src/shared/hooks/useAuth.tsx
git add frontend/src/store/server/auth-queries.ts
git add db/init/01_init.sql db/init/03_insert_blogs.sql
git add backend/Models/Reaction.php backend/Controllers/ReactionController.php backend/Controllers/BlogController.php

git commit -m "fix(blog): improve authentication, fix bugs, and refactor reactions

- Fix image upload issues (Content-Type header, multiple files)
- Add cache-busting for featured images
- Improve authentication: token validation, auto-logout on expiry
- Fix CORS issues with retry headers
- Simplify reaction system from like/love to single 'like' type
- Fix reaction count initialization on blog detail page
- Simplify image naming display (hide blog ID in UI)
- Transform simplified image URLs (bl_1.png) to full URLs on render"
```

