/**
 * Blog API Service
 * 
 * Service layer for blog-related API calls.
 */

import { api, type ApiResponse } from '../http/api';

// ==================== Types ====================

export interface BlogPost {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  featured_image?: string;
  views: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  comments?: BlogComment[];
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar?: string;
}

export interface BlogCategory {
  category: string;
  count: number;
}

export interface BlogListResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  featured_image?: string;
}

export interface UpdateBlogPostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  featured_image?: string;
  is_published?: boolean;
  is_featured?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: number;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
}

// ==================== API Methods ====================

export const blogApi = {
  /**
   * Get list of blog posts
   */
  async getPosts(params?: BlogListParams): Promise<ApiResponse<BlogListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured ? '1' : '0');

    const query = queryParams.toString();
    return api.blogRequest<BlogListResponse>(`/api/blog${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get single blog post by ID or slug
   */
  async getPost(identifier: string | number): Promise<ApiResponse<BlogPost>> {
    return api.blogRequest<BlogPost>(`/api/blog/${identifier}`, {
      method: 'GET',
    });
  },

  /**
   * Create new blog post
   */
  async createPost(data: CreateBlogPostRequest): Promise<ApiResponse<BlogPost>> {
    return api.blogRequest<BlogPost>('/api/blog', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update blog post
   */
  async updatePost(id: number, data: UpdateBlogPostRequest): Promise<ApiResponse<BlogPost>> {
    return api.blogRequest<BlogPost>(`/api/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete blog post
   */
  async deletePost(id: number): Promise<ApiResponse<null>> {
    return api.blogRequest<null>(`/api/blog/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle like on blog post
   */
  async toggleLike(postId: number): Promise<ApiResponse<{ liked: boolean; likes_count: number }>> {
    return api.blogRequest<{ liked: boolean; likes_count: number }>(`/api/blog/${postId}/like`, {
      method: 'POST',
    });
  },

  /**
   * Add comment to blog post
   */
  async addComment(postId: number, data: CreateCommentRequest): Promise<ApiResponse<BlogComment>> {
    return api.blogRequest<BlogComment>(`/api/blog/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<BlogCategory[]>> {
    return api.blogRequest<BlogCategory[]>('/api/blog/categories', {
      method: 'GET',
    });
  },
};

