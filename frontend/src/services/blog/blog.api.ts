/**
 * Blog API Service
 * 
 * Service layer for blog-related API calls.
 */

import { api, type ApiResponse } from '../api';
import type {
    BlogListResponse,
    BlogPost,
    BlogComment,
    Pagination,
    CreateBlogRequest,
    UpdateBlogRequest,
    CreateCommentRequest,
    UpdateCommentRequest,
    ReactionToggleRequest,
    ReactionResponse,
    BlogListParams,
    BlogCategory,
    BlogTag,
    CommentListResponse,
} from './blog.types';

export const blogApi = {
    /**
     * Get list of blog posts
     */
    async getPosts(params?: BlogListParams): Promise<ApiResponse<BlogListResponse>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.tag) queryParams.append('tag', params.tag);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        return api.blogRequest<BlogListResponse>(`/api/blogs${query ? `?${query}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get single blog post by slug
     */
    async getPostBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
        return api.blogRequest<BlogPost>(`/api/blogs/show?slug=${encodeURIComponent(slug)}`, {
            method: 'GET',
        });
    },

    /**
     * Get single blog post by ID
     */
    async getPostById(id: number): Promise<ApiResponse<BlogPost>> {
        return api.blogRequest<BlogPost>(`/api/blogs/show?id=${id}`, {
            method: 'GET',
        });
    },

    /**
     * Get blog post content from MinIO (via backend proxy)
     */
    async getPostContent(id: number): Promise<ApiResponse<{ content: string }>> {
        return api.blogRequest<{ content: string }>(`/api/blogs/content?id=${id}`, {
            method: 'GET',
        });
    },

    /**
     * Create new blog post
     */
    async createPost(data: CreateBlogRequest): Promise<ApiResponse<BlogPost>> {
        return api.blogRequest<BlogPost>('/api/blogs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update blog post
     */
    async updatePost(id: number, data: UpdateBlogRequest): Promise<ApiResponse<BlogPost>> {
        return api.blogRequest<BlogPost>(`/api/blogs?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Upload featured image for a blog post
     */
    async uploadFeaturedImage(id: number, file: File): Promise<ApiResponse<null>> {
        const formData = new FormData();
        formData.append('image', file, `bl${id}.png`);

        return api.blogRequest<null>(`/api/blogs/featured-image?id=${id}`, {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Upload inline images for markdown content
     * Files will be renamed to bl{id}_1.png, bl{id}_2.png...
     */
    async uploadInlineImages(id: number, files: File[]): Promise<ApiResponse<null>> {
        const formData = new FormData();
        files.forEach((file, idx) => {
            // Use images[] so PHP populates $_FILES['images'] as an array
            formData.append('images[]', file, `bl${id}_${idx + 1}.png`);
        });

        return api.blogRequest<null>(`/api/blogs/images?id=${id}`, {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Delete blog post
     */
    async deletePost(id: number): Promise<ApiResponse<null>> {
        return api.blogRequest<null>(`/api/blogs?id=${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get current user's blogs
     */
    async getMyPosts(params?: { page?: number; per_page?: number; status?: string }): Promise<ApiResponse<BlogListResponse>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        return api.blogRequest<BlogListResponse>(`/api/blogs/my-blogs${query ? `?${query}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get blogs by category slug
     */
    async getByCategory(slug: string, page?: number): Promise<ApiResponse<BlogListResponse & { category: BlogCategory }>> {
        const params = new URLSearchParams({ slug });
        if (page) params.append('page', page.toString());
        return api.blogRequest(`/api/blogs/category?${params.toString()}`, {
            method: 'GET',
        });
    },

    /**
     * Get blogs by tag slug
     */
    async getByTag(slug: string, page?: number): Promise<ApiResponse<BlogListResponse & { tag: BlogTag }>> {
        const params = new URLSearchParams({ slug });
        if (page) params.append('page', page.toString());
        return api.blogRequest(`/api/blogs/tag?${params.toString()}`, {
            method: 'GET',
        });
    },

    // ==================== Categories & Tags ====================

    /**
     * Get all categories
     */
    async getCategories(): Promise<ApiResponse<BlogCategory[]>> {
        return api.blogRequest<BlogCategory[]>('/api/blog-categories', {
            method: 'GET',
        });
    },

    /**
     * Get all tags
     */
    async getTags(): Promise<ApiResponse<BlogTag[]>> {
        return api.blogRequest<BlogTag[]>('/api/blog-tags', {
            method: 'GET',
        });
    },

    // ==================== Comments ====================

    /**
     * Get comments for a blog
     */
    async getComments(blogId: number, page?: number): Promise<ApiResponse<CommentListResponse>> {
        const params = new URLSearchParams({ blog_id: blogId.toString() });
        if (page) params.append('page', page.toString());
        return api.blogRequest<CommentListResponse>(`/api/comments?${params.toString()}`, {
            method: 'GET',
        });
    },

    /**
     * Add comment to blog
     */
    async addComment(data: CreateCommentRequest): Promise<ApiResponse<BlogComment>> {
        return api.blogRequest<BlogComment>('/api/comments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update comment
     */
    async updateComment(id: number, data: UpdateCommentRequest): Promise<ApiResponse<BlogComment>> {
        return api.blogRequest<BlogComment>(`/api/comments?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete comment
     */
    async deleteComment(id: number): Promise<ApiResponse<null>> {
        return api.blogRequest<null>(`/api/comments?id=${id}`, {
            method: 'DELETE',
        });
    },

    // ==================== Reactions ====================

    /**
     * Toggle reaction on blog or comment
     */
    async toggleReaction(data: ReactionToggleRequest): Promise<ApiResponse<ReactionResponse>> {
        return api.blogRequest<ReactionResponse>('/api/reactions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get reaction info
     */
    async getReactionInfo(blogId?: number, commentId?: number): Promise<ApiResponse<{
        count: number;
        reactions?: { like: number; love: number };
        user_reaction?: 'like' | 'love' | null;
    }>> {
        const params = new URLSearchParams();
        if (blogId) params.append('blog_id', blogId.toString());
        if (commentId) params.append('comment_id', commentId.toString());
        return api.blogRequest(`/api/reactions?${params.toString()}`, {
            method: 'GET',
        });
    },
};
