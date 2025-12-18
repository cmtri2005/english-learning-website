import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/button';
import { PenSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlogList } from './components/BlogList';
import { FilterSidebar } from './components/FilterSidebar';
import { useBlogs } from './hooks/useBlogs';
import { useBlogFilters } from './hooks/useFilters';
import { useAuth } from '@/shared/hooks/useAuth';

export default function Blog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

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
    const { categories, tags, isLoading: filtersLoading } = useBlogFilters();

    // Update URL when filters change
    const updateFilters = (key: string, value: string | undefined) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        // Reset page when filters change
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

    const handleSearchChange = (query: string) => {
        updateFilters('search', query || undefined);
        setSearch(query);
    };

    const handleCategoryChange = (slug: string | undefined) => {
        updateFilters('category', slug);
        setCategory(slug);
    };

    const handleTagChange = (slug: string | undefined) => {
        updateFilters('tag', slug);
        setTag(slug);
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Blog</h1>
                        <p className="text-muted-foreground mt-1">
                            Khám phá các bài viết về học tiếng Anh
                        </p>
                    </div>
                    {isAuthenticated && (
                        <Link to="/blog/create">
                            <Button>
                                <PenSquare className="h-4 w-4 mr-2" />
                                Viết bài mới
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="lg:w-80 flex-shrink-0">
                        <FilterSidebar
                            categories={categories}
                            tags={tags}
                            selectedCategory={category}
                            selectedTag={tag}
                            searchQuery={search}
                            onCategoryChange={handleCategoryChange}
                            onTagChange={handleTagChange}
                            onSearchChange={handleSearchChange}
                            isLoading={filtersLoading}
                        />
                    </aside>

                    {/* Blog List */}
                    <main className="flex-1">
                        <BlogList
                            blogs={blogs}
                            pagination={pagination}
                            isLoading={isLoading}
                            error={error}
                            onPageChange={handlePageChange}
                        />
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
