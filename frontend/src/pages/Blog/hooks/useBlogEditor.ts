import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi } from '@/services/blog/blog.api';
import type { CreateBlogRequest, UpdateBlogRequest } from '@/services/blog/blog.types';

interface UseBlogEditorOptions {
    blogId?: string;
    isAuthenticated: boolean;
}

interface UseBlogEditorReturn {
    // Form state
    title: string;
    setTitle: (value: string) => void;
    content: string;
    setContent: (value: string) => void;
    excerpt: string;
    setExcerpt: (value: string) => void;
    categoryId: string;
    setCategoryId: (value: string) => void;
    selectedTags: number[];
    toggleTag: (tagId: number) => void;

    // Status
    isEditing: boolean;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;

    // Actions
    handleSubmit: (
        status: 'draft' | 'published',
        options?: {
            featuredImage?: File | null;
            inlineImages?: File[];
        }
    ) => Promise<void>;
}

export function useBlogEditor({ blogId, isAuthenticated }: UseBlogEditorOptions): UseBlogEditorReturn {
    const navigate = useNavigate();
    const isEditing = !!blogId;

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [selectedTags, setSelectedTags] = useState<number[]>([]);

    // Status state
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Fetch existing blog for editing
    useEffect(() => {
        if (isEditing && blogId) {
            setIsFetching(true);
            const fetchData = async () => {
                try {
                    // Fetch blog metadata
                    const response = await blogApi.getPostById(parseInt(blogId));
                    if (response.success && response.data) {
                        const blog = response.data;
                        setTitle(blog.title);
                        setExcerpt(blog.excerpt || '');
                        setCategoryId(blog.category?.id?.toString() || '');
                        setSelectedTags(blog.tags?.map(t => t.id) || []);

                        // Fetch markdown content from backend API
                        const contentResponse = await blogApi.getPostContent(blog.id);
                        if (contentResponse.success && contentResponse.data?.content) {
                            setContent(contentResponse.data.content);
                        }
                    } else {
                        setError('Không thể tải bài viết');
                    }
                } catch (err: any) {
                    setError(err.message || 'Đã xảy ra lỗi');
                } finally {
                    setIsFetching(false);
                }
            };
            fetchData();
        }
    }, [blogId, isEditing]);

    const toggleTag = useCallback((tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    }, []);

    const handleSubmit = useCallback(async (submitStatus: 'draft' | 'published', options?: { featuredImage?: File | null; inlineImages?: File[] }) => {
        if (!title.trim()) {
            setError('Tiêu đề không được để trống');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let currentId = blogId ? parseInt(blogId) : undefined;

            if (isEditing && blogId) {
                const updateData: UpdateBlogRequest = {
                    title: title.trim(),
                    content: content.trim() || undefined,
                    excerpt: excerpt.trim() || undefined,
                    category_id: categoryId ? parseInt(categoryId) : undefined,
                    tags: selectedTags,
                    status: submitStatus,
                };

                console.log('DEBUG: Sending update request:', JSON.stringify(updateData, null, 2));
                const response = await blogApi.updatePost(parseInt(blogId), updateData);
                if (response.success && response.data) {
                    currentId = response.data.id;
                    // Upload images if provided
                    if (currentId && options?.featuredImage) {
                        await blogApi.uploadFeaturedImage(currentId, options.featuredImage);
                    }
                    if (currentId && options?.inlineImages?.length) {
                        await blogApi.uploadInlineImages(currentId, options.inlineImages);
                    }
                    navigate(`/blog/${response.data.slug}`);
                } else {
                    setError(response.message || 'Không thể cập nhật bài viết');
                }
            } else {
                const createData: CreateBlogRequest = {
                    title: title.trim(),
                    content: content.trim() || undefined,
                    excerpt: excerpt.trim() || undefined,
                    category_id: categoryId ? parseInt(categoryId) : undefined,
                    tags: selectedTags,
                    status: submitStatus,
                };

                const response = await blogApi.createPost(createData);
                if (response.success && response.data) {
                    currentId = response.data.id;
                    // Upload images after creation to ensure we have an ID for naming
                    if (currentId && options?.featuredImage) {
                        await blogApi.uploadFeaturedImage(currentId, options.featuredImage);
                    }
                    if (currentId && options?.inlineImages?.length) {
                        await blogApi.uploadInlineImages(currentId, options.inlineImages);
                    }
                    navigate(`/blog/${response.data.slug}`);
                } else {
                    setError(response.message || 'Không thể tạo bài viết');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }, [title, content, excerpt, categoryId, selectedTags, isEditing, blogId, navigate]);

    return {
        title,
        setTitle,
        content,
        setContent,
        excerpt,
        setExcerpt,
        categoryId,
        setCategoryId,
        selectedTags,
        toggleTag,
        isEditing,
        isLoading,
        isFetching,
        error,
        handleSubmit,
    };
}
