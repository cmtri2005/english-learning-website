import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi } from '@/services/blog';

interface UsePostActionsOptions {
    blogId: number;
    isOwner: boolean;
}

interface UsePostActionsReturn {
    isDeleting: boolean;
    handleDelete: () => Promise<void>;
    handleShare: (platform: 'facebook' | 'twitter' | 'copy') => void;
}

export function usePostActions({ blogId, isOwner }: UsePostActionsOptions): UsePostActionsReturn {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!isOwner || !confirm('Bạn có chắc muốn xóa bài viết này?')) return;

        setIsDeleting(true);
        try {
            await blogApi.deletePost(blogId);
            navigate('/blog');
        } catch (err) {
            alert('Không thể xóa bài viết');
        } finally {
            setIsDeleting(false);
        }
    }, [blogId, isOwner, navigate]);

    const handleShare = useCallback((platform: 'facebook' | 'twitter' | 'copy') => {
        const url = window.location.href;
        const title = document.title;

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                alert('Đã sao chép link!');
                break;
        }
    }, []);

    return {
        isDeleting,
        handleDelete,
        handleShare,
    };
}
