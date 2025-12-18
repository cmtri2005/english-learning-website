import { useState, useEffect, useCallback } from 'react';
import { blogApi, type BlogPost, type BlogListParams, type Pagination } from '@/services/blog/index';

interface UseBlogsOptions extends BlogListParams {
    enabled?: boolean;
}

interface UseBlogsReturn {
    blogs: BlogPost[];
    pagination: Pagination | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    setPage: (page: number) => void;
    setSearch: (search: string) => void;
    setCategory: (category: string | undefined) => void;
    setTag: (tag: string | undefined) => void;
}

export function useBlogs(options: UseBlogsOptions = {}): UseBlogsReturn {
    const { enabled = true, ...initialParams } = options;

    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<BlogListParams>(initialParams);

    const fetchBlogs = useCallback(async () => {
        if (!enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await blogApi.getPosts(params);
            if (response.success && response.data) {
                setBlogs(response.data.blogs);
                setPagination(response.data.pagination);
            } else {
                setError(response.message || 'Không thể tải danh sách blog');
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }, [params, enabled]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    const setPage = useCallback((page: number) => {
        setParams(prev => ({ ...prev, page }));
    }, []);

    const setSearch = useCallback((search: string) => {
        setParams(prev => ({ ...prev, search, page: 1 }));
    }, []);

    const setCategory = useCallback((category: string | undefined) => {
        setParams(prev => ({ ...prev, category, page: 1 }));
    }, []);

    const setTag = useCallback((tag: string | undefined) => {
        setParams(prev => ({ ...prev, tag, page: 1 }));
    }, []);

    return {
        blogs,
        pagination,
        isLoading,
        error,
        refetch: fetchBlogs,
        setPage,
        setSearch,
        setCategory,
        setTag,
    };
}
