import { useState, useEffect, useCallback } from 'react';
import { blogApi, type BlogPost } from '@/services/blog';

interface UseBlogDetailReturn {
    blog: BlogPost | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useBlogDetail(slug: string): UseBlogDetailReturn {
    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBlog = useCallback(async () => {
        if (!slug) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await blogApi.getPostBySlug(slug);
            if (response.success && response.data) {
                setBlog(response.data);
            } else {
                setError(response.message || 'Không tìm thấy blog');
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchBlog();
    }, [fetchBlog]);

    return {
        blog,
        isLoading,
        error,
        refetch: fetchBlog,
    };
}
