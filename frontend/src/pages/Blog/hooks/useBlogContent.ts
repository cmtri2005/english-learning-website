import { useState, useEffect } from 'react';
import { blogApi } from '@/services/blog/blog.api';
import { transformMarkdownImages } from '@/services/storage';

interface UseBlogContentReturn {
    content: string;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to fetch blog markdown content from backend API
 */
export function useBlogContent(blogId: number | null): UseBlogContentReturn {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!blogId) {
            setContent('');
            return;
        }

        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await blogApi.getPostContent(blogId);

                if (response.success && response.data) {
                    // Transform image placeholders to full MinIO URLs
                    const transformedContent = transformMarkdownImages(response.data.content || '');
                    setContent(transformedContent);
                } else {
                    setContent('');
                }
            } catch (err: any) {
                setError(err.message || 'Không thể tải nội dung');
                setContent('');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [blogId]);

    return { content, isLoading, error };
}
