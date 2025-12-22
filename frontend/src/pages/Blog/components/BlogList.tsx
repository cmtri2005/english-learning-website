import { BlogCard } from './BlogCard';
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
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-24">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (blogs.length === 0) {
        return (
            <div className="text-center py-24">
                <p className="text-gray-500">Chưa có bài viết nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {blogs.map(blog => (
                    <BlogCard key={blog.id} blog={blog} />
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex justify-center items-center gap-1">
                    <button
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={pagination.current_page === 1 || isLoading}
                        onClick={() => onPageChange(pagination.current_page - 1)}
                    >
                        ← Trước
                    </button>

                    <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                            .filter(page => {
                                const current = pagination.current_page;
                                return page === 1 || page === pagination.last_page ||
                                    (page >= current - 1 && page <= current + 1);
                            })
                            .map((page, index, arr) => {
                                const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                                return (
                                    <span key={page} className="flex items-center">
                                        {showEllipsisBefore && <span className="px-2 text-gray-400">…</span>}
                                        <button
                                            className={`w-8 h-8 rounded text-sm ${page === pagination.current_page
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            onClick={() => onPageChange(page)}
                                            disabled={isLoading}
                                        >
                                            {page}
                                        </button>
                                    </span>
                                );
                            })}
                    </div>

                    <button
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={pagination.current_page === pagination.last_page || isLoading}
                        onClick={() => onPageChange(pagination.current_page + 1)}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Page info */}
            {pagination && (
                <p className="text-center text-sm text-gray-400">
                    {blogs.length} / {pagination.total} bài viết
                </p>
            )}
        </div>
    );
}

