import { useState, useEffect, useCallback } from 'react';
import { blogApi, type BlogCategory, type BlogTag } from '@/services/blog';

interface UseFiltersReturn {
    categories: BlogCategory[];
    tags: BlogTag[];
    isLoading: boolean;
    error: string | null;
}

export function useBlogFilters(): UseFiltersReturn {
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFilters = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [categoriesRes, tagsRes] = await Promise.all([
                blogApi.getCategories(),
                blogApi.getTags(),
            ]);

            if (categoriesRes.success && categoriesRes.data) {
                setCategories(categoriesRes.data);
            }

            if (tagsRes.success && tagsRes.data) {
                setTags(tagsRes.data);
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);

    return {
        categories,
        tags,
        isLoading,
        error,
    };
}
