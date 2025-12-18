import { useState, useEffect, useCallback } from 'react';
import { blogApi, type BlogComment, type Pagination, type CreateCommentRequest } from '@/services/blog';

interface UseCommentsReturn {
    comments: BlogComment[];
    pagination: Pagination | null;
    isLoading: boolean;
    error: string | null;
    addComment: (content: string) => Promise<boolean>;
    updateComment: (id: number, content: string) => Promise<boolean>;
    deleteComment: (id: number) => Promise<boolean>;
    refetch: () => void;
    loadMore: () => void;
    isSubmitting: boolean;
}

export function useComments(blogId: number): UseCommentsReturn {
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const fetchComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!blogId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await blogApi.getComments(blogId, pageNum);
            if (response.success && response.data) {
                if (append) {
                    setComments(prev => [...prev, ...response.data!.comments]);
                } else {
                    setComments(response.data.comments);
                }
                setPagination(response.data.pagination);
            } else {
                setError(response.message || 'Không thể tải bình luận');
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    }, [blogId]);

    useEffect(() => {
        fetchComments(1, false);
    }, [fetchComments]);

    const addComment = useCallback(async (content: string): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            const response = await blogApi.addComment({ blog_id: blogId, content });
            if (response.success && response.data) {
                // Add new comment to the beginning
                setComments(prev => [response.data!, ...prev]);
                if (pagination) {
                    setPagination({ ...pagination, total: pagination.total + 1 });
                }
                return true;
            }
            setError(response.message || 'Không thể thêm bình luận');
            return false;
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [blogId, pagination]);

    const updateComment = useCallback(async (id: number, content: string): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            const response = await blogApi.updateComment(id, { content });
            if (response.success && response.data) {
                setComments(prev => prev.map(c => c.id === id ? response.data! : c));
                return true;
            }
            setError(response.message || 'Không thể cập nhật bình luận');
            return false;
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const deleteComment = useCallback(async (id: number): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            const response = await blogApi.deleteComment(id);
            if (response.success) {
                setComments(prev => prev.filter(c => c.id !== id));
                if (pagination) {
                    setPagination({ ...pagination, total: pagination.total - 1 });
                }
                return true;
            }
            setError(response.message || 'Không thể xóa bình luận');
            return false;
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [pagination]);

    const loadMore = useCallback(() => {
        if (pagination && page < pagination.last_page) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchComments(nextPage, true);
        }
    }, [page, pagination, fetchComments]);

    const refetch = useCallback(() => {
        setPage(1);
        fetchComments(1, false);
    }, [fetchComments]);

    return {
        comments,
        pagination,
        isLoading,
        error,
        addComment,
        updateComment,
        deleteComment,
        refetch,
        loadMore,
        isSubmitting,
    };
}
