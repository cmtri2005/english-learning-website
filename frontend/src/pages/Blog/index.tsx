import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { PenSquare, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlogList } from './components/BlogList';
import { useBlogs } from './hooks/useBlogs';
import { useBlogFilters } from './hooks/useFilters';
import { useAuth } from '@/shared/hooks/useAuth';
import { useState } from 'react';

export default function Blog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [searchInput, setSearchInput] = useState('');

    // Get filters from URL
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Fetch blogs with filters
    const { blogs, pagination, isLoading, error, setPage, setSearch, setCategory, setTag } = useBlogs({
        page,
        category,
        tag,
        search,
        per_page: 9,
    });

    // Fetch categories and tags
    const { categories, tags } = useBlogFilters();

    // Update URL when filters change
    const updateFilters = (key: string, value: string | undefined) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        if (key !== 'page') {
            newParams.delete('page');
        }
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage: number) => {
        updateFilters('page', newPage.toString());
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters('search', searchInput || undefined);
        setSearch(searchInput);
    };

    const handleCategoryChange = (slug: string | undefined) => {
        updateFilters('category', slug);
        setCategory(slug);
    };

    const handleTagChange = (slug: string | undefined) => {
        updateFilters('tag', slug);
        setTag(slug);
    };

    const clearAllFilters = () => {
        setSearchInput('');
        setSearchParams({});
        setSearch(undefined);
        setCategory(undefined);
        setTag(undefined);
    };

    const hasFilters = category || tag || search;

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50/50">
                {/* Header */}
                <div className="bg-white border-b">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Blog</h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Chia sẻ kiến thức và kinh nghiệm học tiếng Anh
                                </p>
                            </div>
                            {isAuthenticated && (
                                <Link to="/blog/create">
                                    <Button size="sm">
                                        <PenSquare className="h-4 w-4 mr-2" />
                                        Viết bài
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Search & Filters */}
                        <div className="mt-6 space-y-4">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm bài viết..."
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        className="pl-9 bg-gray-50 border-gray-200"
                                    />
                                </div>
                                <Button type="submit" variant="outline">
                                    Tìm
                                </Button>
                            </form>

                            {/* Category tabs */}
                            {categories.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleCategoryChange(undefined)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${!category
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategoryChange(category === cat.slug ? undefined : cat.slug)}
                                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${category === cat.slug
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Active filters indicator */}
                            {hasFilters && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500">Đang lọc:</span>
                                    {search && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                            "{search}"
                                            <button onClick={() => { setSearchInput(''); updateFilters('search', undefined); setSearch(undefined); }}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                    {tag && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded">
                                            #{tags.find(t => t.slug === tag)?.name || tag}
                                            <button onClick={() => handleTagChange(undefined)}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-8">
                    <BlogList
                        blogs={blogs}
                        pagination={pagination}
                        isLoading={isLoading}
                        error={error}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

