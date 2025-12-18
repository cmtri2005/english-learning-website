export interface BlogAuthor {
    id: number;
    name: string;
    avatar?: string;
    email?: string;
}

export interface BlogCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    blog_count?: number;
}

export interface BlogTag {
    id: number;
    name: string;
    slug: string;
    blog_count?: number;
}

export interface BlogPost {
    id: number;
    user_id?: number;
    title: string;
    slug: string;
    excerpt: string;
    status: 'draft' | 'published' | 'archived';
    view_count: number;
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at?: string;
    author?: BlogAuthor;
    category?: BlogCategory;
    tags?: BlogTag[];
    likes_count?: number;
    comments_count?: number;
    has_reacted?: boolean;
}

export interface BlogComment {
    id: number;
    blog_id: number;
    user_id: number;
    content: string;
    old_content?: string;
    created_at: string;
    updated_at?: string;
    author: BlogAuthor;
    likes_count: number;
    has_reacted?: boolean;
}

export interface Pagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface BlogListResponse {
    blogs: BlogPost[];
    pagination: Pagination;
}

export interface CommentListResponse {
    comments: BlogComment[];
    pagination: Pagination;
}

export interface CreateBlogRequest {
    title: string;
    content?: string;
    excerpt?: string;
    category_id?: number;
    status?: 'draft' | 'published';
    tags?: number[];
    meta_title?: string;
    meta_description?: string;
}

export interface UpdateBlogRequest {
    title?: string;
    content?: string;
    excerpt?: string;
    category_id?: number;
    status?: 'draft' | 'published' | 'archived';
    tags?: number[];
    meta_title?: string;
    meta_description?: string;
}

export interface CreateCommentRequest {
    blog_id: number;
    content: string;
}

export interface UpdateCommentRequest {
    content: string;
}

export interface ReactionToggleRequest {
    blog_id?: number;
    comment_id?: number;
}

export interface ReactionResponse {
    action: 'added' | 'removed';
    has_reacted: boolean;
    count: number;
    target_type: 'blog' | 'comment';
}

export interface BlogListParams {
    page?: number;
    per_page?: number;
    category?: string;
    tag?: string;
    search?: string;
    status?: string;
}
