import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
    ArrowLeft,
    Calendar,
    Eye,
    Share2,
    Facebook,
    Twitter,
    Link as LinkIcon,
    Edit,
    Trash2,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useBlogDetail } from '../hooks/useBlogDetail';
import { useBlogContent } from '../hooks/useBlogContent';
import { useBlogReaction } from '../hooks/useReactions';
import { usePostActions } from '../hooks/usePostActions';
import { ReactionButton } from './ReactionButton';
import { CommentSection } from './CommentSection';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAuth } from '@/shared/hooks/useAuth';
import { getBlogFeaturedImageUrl } from '@/services/storage';

export function BlogDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { user, isAuthenticated } = useAuth();
    const { blog, isLoading, error } = useBlogDetail(slug || '');

    // Fetch markdown content from MinIO
    const {
        content,
        isLoading: contentLoading,
        error: contentError
    } = useBlogContent(blog?.id || null);

    const isOwner = isAuthenticated && user?.id === blog?.author?.id;

    const { isDeleting, handleDelete, handleShare } = usePostActions({
        blogId: blog?.id || 0,
        isOwner,
    });

    const {
        hasReacted,
        count: reactionCount,
        isLoading: reactionLoading,
        toggle: toggleReaction,
    } = useBlogReaction(blog?.id || 0, {
        initialHasReacted: blog?.has_reacted,
        initialCount: blog?.likes_count || 0,
    });

    // Generate featured image URL from MinIO
    // Append updated_at as cache-busting query so UI reflects latest image
    const featuredImageUrl = blog?.id
        ? `${getBlogFeaturedImageUrl(blog.id)}${blog.updated_at ? `?v=${encodeURIComponent(blog.updated_at)}` : ''}`
        : null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (error || !blog) {
        return (
            <AppLayout>
                <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h1>
                    <p className="text-muted-foreground mb-8">{error || 'Bài viết không tồn tại hoặc đã bị xóa'}</p>
                    <Link to="/blog">
                        <Button>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại Blog
                        </Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <article className="mx-auto px-6 lg:px-10 py-8 w-full max-w-screen-xl">
                {/* Back Button */}
                <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại Blog
                </Link>

                {/* Featured Image */}
                {featuredImageUrl && (
                    <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
                        <img
                            src={featuredImageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Hide image if not found
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Header */}
                <header className="mb-8">
                    {/* Category & Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {blog.category && (
                            <Link to={`/blog?category=${blog.category.slug}`}>
                                <Badge variant="secondary" className="hover:bg-secondary/80">
                                    {blog.category.name}
                                </Badge>
                            </Link>
                        )}
                        {blog.tags?.map(tag => (
                            <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                                    #{tag.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">{blog.title}</h1>

                    {/* Author & Meta */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={blog.author?.avatar} />
                                <AvatarFallback>{blog.author?.name ? getInitials(blog.author.name) : '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{blog.author?.name}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(blog.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        {blog.view_count} lượt xem
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Owner Actions */}
                            {isOwner && (
                                <>
                                    <Link to={`/blog/edit/${blog.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Chỉnh sửa
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </>
                            )}

                            {/* Share Button */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Chia sẻ
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                                        <Facebook className="h-4 w-4 mr-2" />
                                        Facebook
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                                        <Twitter className="h-4 w-4 mr-2" />
                                        Twitter
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare('copy')}>
                                        <LinkIcon className="h-4 w-4 mr-2" />
                                        Sao chép link
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <Separator className="my-8" />

                {/* Content */}
                <div className="mb-8">
                    {contentLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : contentError ? (
                        <div className="text-center text-muted-foreground py-10">
                            {contentError}
                        </div>
                    ) : (
                        <MarkdownRenderer content={content} blogId={blog?.id} />
                    )}
                </div>

                <Separator className="my-8" />

                {/* Reactions */}
                <Card className="mb-8">
                    <CardContent className="py-6">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">Bạn thấy bài viết này thế nào?</p>
                            <ReactionButton
                                hasReacted={hasReacted}
                                count={reactionCount}
                                isLoading={reactionLoading}
                                onToggle={toggleReaction}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Comments */}
                <CommentSection blogId={blog.id} />
            </article>
        </AppLayout>
    );
}
