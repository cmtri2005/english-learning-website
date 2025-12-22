import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, ImageOff } from 'lucide-react';
import type { BlogPost } from '@/services/blog/blog.types';
import { getBlogFeaturedImageUrl } from '@/services/storage';

interface BlogCardProps {
    blog: BlogPost;
}

export function BlogCard({ blog }: BlogCardProps) {
    const [imageError, setImageError] = useState(false);

    const authorInitials = blog.author?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || '?';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const featuredImageUrl = `${getBlogFeaturedImageUrl(blog.id)}${blog.updated_at ? `?v=${encodeURIComponent(blog.updated_at)}` : ''}`;

    return (
        <article className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
            {/* Image */}
            <Link to={`/blog/${blog.slug}`} className="block">
                <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    {!imageError ? (
                        <img
                            src={featuredImageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageOff className="h-8 w-8 text-gray-300" />
                        </div>
                    )}
                </div>
            </Link>

            {/* Content */}
            <div className="p-4">
                {/* Category */}
                {blog.category && (
                    <Link
                        to={`/blog?category=${blog.category.slug}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 uppercase tracking-wide"
                    >
                        {blog.category.name}
                    </Link>
                )}

                {/* Title */}
                <Link to={`/blog/${blog.slug}`}>
                    <h2 className="mt-2 text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {blog.title}
                    </h2>
                </Link>

                {/* Excerpt */}
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {blog.excerpt}
                </p>

                {/* Meta */}
                <div className="mt-4 flex items-center justify-between">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {authorInitials}
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-700">{blog.author?.name}</span>
                            <span className="text-gray-400 mx-1">·</span>
                            <span className="text-gray-400">{formatDate(blog.created_at)}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                        <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {blog.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {blog.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {blog.comments_count || 0}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}

