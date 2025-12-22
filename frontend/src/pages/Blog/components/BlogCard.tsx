import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Heart, MessageCircle, Eye, Calendar, ImageOff } from 'lucide-react';
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
            month: 'short',
            year: 'numeric',
        });
    };

    // Generate featured image URL from MinIO
    // Append updated_at as cache-busting query so UI reflects latest image
    const featuredImageUrl = `${getBlogFeaturedImageUrl(blog.id)}${blog.updated_at ? `?v=${encodeURIComponent(blog.updated_at)}` : ''}`;

    return (
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Featured Image */}
            <Link to={`/blog/${blog.slug}`}>
                <div className="relative h-48 overflow-hidden bg-muted">
                    {!imageError ? (
                        <img
                            src={featuredImageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <ImageOff className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                    )}
                    {blog.category && (
                        <Badge className="absolute top-3 left-3" variant="secondary">
                            {blog.category.name}
                        </Badge>
                    )}
                </div>
            </Link>

            <CardHeader className="pb-2">
                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {blog.tags.slice(0, 3).map(tag => (
                            <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                                <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground">
                                    #{tag.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Title */}
                <Link to={`/blog/${blog.slug}`}>
                    <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                    </h3>
                </Link>
            </CardHeader>

            <CardContent className="pb-2">
                {/* Excerpt */}
                <p className="text-muted-foreground text-sm line-clamp-3">
                    {blog.excerpt}
                </p>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-4 border-t">
                {/* Author */}
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={blog.author?.avatar} />
                        <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{blog.author?.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(blog.created_at)}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {blog.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {blog.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {blog.comments_count || 0}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
