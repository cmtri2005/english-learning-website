import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Search, X } from 'lucide-react';
import type { BlogCategory, BlogTag } from '@/services/blog';

interface FilterSidebarProps {
    categories: BlogCategory[];
    tags: BlogTag[];
    selectedCategory?: string;
    selectedTag?: string;
    searchQuery?: string;
    onCategoryChange: (slug: string | undefined) => void;
    onTagChange: (slug: string | undefined) => void;
    onSearchChange: (query: string) => void;
    isLoading?: boolean;
}

export function FilterSidebar({
    categories,
    tags,
    selectedCategory,
    selectedTag,
    searchQuery = '',
    onCategoryChange,
    onTagChange,
    onSearchChange,
    isLoading,
}: FilterSidebarProps) {
    const [search, setSearch] = useState(searchQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchChange(search);
    };

    const clearFilters = () => {
        setSearch('');
        onCategoryChange(undefined);
        onTagChange(undefined);
        onSearchChange('');
    };

    const hasActiveFilters = selectedCategory || selectedTag || searchQuery;

    return (
        <div className="space-y-6">
            {/* Search */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tìm kiếm</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Tìm kiếm bài viết..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Active Filters */}
            {hasActiveFilters && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Bộ lọc đang dùng</CardTitle>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Xóa tất cả
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {searchQuery && (
                            <Badge variant="secondary" className="cursor-pointer" onClick={() => onSearchChange('')}>
                                Tìm: "{searchQuery}" <X className="h-3 w-3 ml-1" />
                            </Badge>
                        )}
                        {selectedCategory && (
                            <Badge variant="secondary" className="cursor-pointer" onClick={() => onCategoryChange(undefined)}>
                                {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                                <X className="h-3 w-3 ml-1" />
                            </Badge>
                        )}
                        {selectedTag && (
                            <Badge variant="secondary" className="cursor-pointer" onClick={() => onTagChange(undefined)}>
                                #{tags.find(t => t.slug === selectedTag)?.name || selectedTag}
                                <X className="h-3 w-3 ml-1" />
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Categories */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Danh mục</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${selectedCategory === category.slug
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                                }`}
                            onClick={() => onCategoryChange(selectedCategory === category.slug ? undefined : category.slug)}
                        >
                            <span>{category.name}</span>
                            <Badge variant={selectedCategory === category.slug ? 'secondary' : 'outline'}>
                                {category.blog_count || 0}
                            </Badge>
                        </button>
                    ))}
                    {categories.length === 0 && (
                        <p className="text-muted-foreground text-sm">Không có danh mục</p>
                    )}
                </CardContent>
            </Card>

            {/* Tags */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <Badge
                                key={tag.id}
                                variant={selectedTag === tag.slug ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => onTagChange(selectedTag === tag.slug ? undefined : tag.slug)}
                            >
                                #{tag.name}
                                {tag.blog_count !== undefined && ` (${tag.blog_count})`}
                            </Badge>
                        ))}
                        {tags.length === 0 && (
                            <p className="text-muted-foreground text-sm">Không có tag</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
