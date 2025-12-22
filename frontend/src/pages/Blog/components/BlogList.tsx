import { BlogCard } from './BlogCard';
import { Button } from '@/shared/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { BlogPost, Pagination } from '@/services/blog';

interface BlogListProps {
    blogs: BlogPost[];
    pagination: Pagination | null;
    isLoading: boolean;
    error: string | null;
    onPageChange: (page: number) => void;
}

export function BlogList({ blogs, pagination, isLoading, error, onPageChange }: BlogListProps) {
    if (isLoading && blogs.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    if (blogs.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Không có blog nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map(blog => (
                    <BlogCard key={blog.id} blog={blog} />
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex justify-center items-center gap-2">
                    <Button
                        variant="outline"
                        disabled={pagination.current_page === 1 || isLoading}
                        onClick={() => onPageChange(pagination.current_page - 1)}
                    >
                        Trước
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                            .filter(page => {
                                const current = pagination.current_page;
                                return page === 1 || page === pagination.last_page ||
                                    (page >= current - 2 && page <= current + 2);
                            })
                            .map((page, index, arr) => {
                                // Add ellipsis
                                const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;

                                return (
                                    <span key={page} className="flex items-center">
                                        {showEllipsisBefore && <span className="px-2">...</span>}
                                        <Button
                                            variant={page === pagination.current_page ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => onPageChange(page)}
                                            disabled={isLoading}
                                        >
                                            {page}
                                        </Button>
                                    </span>
                                );
                            })}
                    </div>

                    <Button
                        variant="outline"
                        disabled={pagination.current_page === pagination.last_page || isLoading}
                        onClick={() => onPageChange(pagination.current_page + 1)}
                    >
                        Sau
                    </Button>
                </div>
            )}

            {/* Page info */}
            {pagination && (
                <p className="text-center text-sm text-muted-foreground">
                    Hiển thị {blogs.length} / {pagination.total} bài viết
                </p>
            )}
        </div>
    );
}
