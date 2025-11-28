import { Link } from "react-router-dom";
import { MessageCircle, Heart, Share2 } from "lucide-react";
import { useToggleBlogLike } from "@/store/server/blog-queries";
import { useAuth } from "@/shared/hooks/useAuth";
import type { BlogPost } from "@/services/blog/blog-api";
import { formatDistanceToNow } from "date-fns";

interface BlogPostCardProps {
  post: BlogPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const { isLoggedIn } = useAuth();
  const toggleLike = useToggleBlogLike();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoggedIn) {
      toggleLike.mutate(post.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.origin + `/blog/${post.slug}`,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/blog/${post.slug}`);
    }
  };

  const gradientClass = `bg-gradient-to-br from-primary/20 to-primary/5`;

  return (
    <Link to={`/blog/${post.slug}`}>
      <div className="rounded-xl border bg-background overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
        <div className={`h-40 ${gradientClass}`} />
        <div className="flex flex-col flex-1 p-6">
          <div className="flex gap-2 mb-3">
            <span className="px-2 py-1 rounded text-primary bg-primary/10 text-xs font-semibold">
              {post.category}
            </span>
            {post.is_featured && (
              <span className="px-2 py-1 rounded text-secondary bg-secondary/10 text-xs font-semibold">
                Featured
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
          <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="border-t pt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              By <span className="font-semibold">{post.author_name}</span>
            </span>
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition ${
                post.is_liked
                  ? "text-red-500"
                  : "hover:text-primary"
              }`}
              disabled={!isLoggedIn || toggleLike.isPending}
            >
              <Heart size={16} className={post.is_liked ? "fill-current" : ""} />
              {post.likes_count}
            </button>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} />
              {post.comments_count}
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-primary transition"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

