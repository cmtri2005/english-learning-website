import { useState, useCallback, useEffect } from 'react';
import { blogApi } from '@/services/blog';

interface UseReactionsOptions {
    initialHasReacted?: boolean;
    initialCount?: number;
}

interface UseReactionsReturn {
    hasReacted: boolean;
    count: number;
    isLoading: boolean;
    toggle: () => Promise<void>;
}

export function useBlogReaction(
    blogId: number,
    options: UseReactionsOptions = {}
): UseReactionsReturn {
    const [hasReacted, setHasReacted] = useState<boolean>(options.initialHasReacted ?? false);
    const [count, setCount] = useState(options.initialCount ?? 0);
    const [isLoading, setIsLoading] = useState(false);

    // Sync state when initial values change (e.g. after blog data is loaded)
    useEffect(() => {
        setHasReacted(options.initialHasReacted ?? false);
        setCount(options.initialCount ?? 0);
    }, [blogId, options.initialHasReacted, options.initialCount]);

    const toggle = useCallback(
        async () => {
            // Prevent spam
            if (isLoading) return;

            setIsLoading(true);

            const prevHasReacted = hasReacted;
            const prevCount = count;

            try {
                const response = await blogApi.toggleReaction({ blog_id: blogId });

                if (response.success && response.data) {
                    // Always trust server data
                    setHasReacted(response.data.has_reacted);
                    setCount(response.data.count);
                } else {
                    // Revert on failure
                    setHasReacted(prevHasReacted);
                    setCount(prevCount);
                }
            } catch {
                // Revert on error
                setHasReacted(prevHasReacted);
                setCount(prevCount);
            } finally {
                setIsLoading(false);
            }
        },
        [blogId, hasReacted, count, isLoading]
    );

    return {
        hasReacted,
        count,
        isLoading,
        toggle,
    };
}

export function useCommentReaction(
    commentId: number,
    options: UseReactionsOptions = {}
): UseReactionsReturn {
    const [hasReacted, setHasReacted] = useState<boolean>(options.initialHasReacted ?? false);
    const [count, setCount] = useState(options.initialCount ?? 0);
    const [isLoading, setIsLoading] = useState(false);

    // Sync state when initial values change (e.g. when comments are refetched)
    useEffect(() => {
        setHasReacted(options.initialHasReacted ?? false);
        setCount(options.initialCount ?? 0);
    }, [commentId, options.initialHasReacted, options.initialCount]);

    const toggle = useCallback(
        async () => {
            // Prevent spam
            if (isLoading) return;

            setIsLoading(true);

            const prevHasReacted = hasReacted;
            const prevCount = count;

            try {
                const response = await blogApi.toggleReaction({ comment_id: commentId });

                if (response.success && response.data) {
                    // Always trust server data
                    setHasReacted(response.data.has_reacted);
                    setCount(response.data.count);
                } else {
                    // Revert on failure
                    setHasReacted(prevHasReacted);
                    setCount(prevCount);
                }
            } catch {
                // Revert on error
                setHasReacted(prevHasReacted);
                setCount(prevCount);
            } finally {
                setIsLoading(false);
            }
        },
        [commentId, hasReacted, count, isLoading]
    );

    return {
        hasReacted,
        count,
        isLoading,
        toggle,
    };
}
