import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import { ArrowLeft, Heart, MessageCircle, Share2, Edit2, Trash2 } from "lucide-react";
import { useBlogPost, useToggleBlogLike, useAddBlogComment, useDeleteBlogPost } from "@/store/server/blog-queries";
import { useAuth } from "@/shared/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import BlogCommentForm from "./components/BlogCommentForm";
import BlogCommentList from "./components/BlogCommentList";

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [showCommentForm, setShowCommentForm] = useState(false);

  const { data: post, isLoading, error } = useBlogPost(slug || "");
  const toggleLike = useToggleBlogLike();
  const addComment = useAddBlogComment();
  const deletePost = useDeleteBlogPost();

  const handleLike = () => {
    if (isLoggedIn && post) {
      toggleLike.mutate(post.id);
    }
  };

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else if (post) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await deletePost.mutateAsync(post.id);
      navigate("/blog");
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const isAuthor = post && user && post.author_id === user.id;
  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !post) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-destructive">Post not found</p>
            <Link to="/blog">
              <Button variant="outline" className="mt-4">
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link to="/blog">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft size={16} />
            Back to Blog
          </Button>
        </Link>

        {/* Post Header */}
        <article className="bg-background rounded-xl border p-8 md:p-12">
          {/* Category & Actions */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {post.category}
              </span>
              {post.is_featured && (
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
                  Featured
                </span>
              )}
            </div>
            {(isAuthor || isAdmin) && (
              <div className="flex gap-2">
                <Link to={`/blog/edit/${post.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit2 size={16} />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{post.author_name}</span>
            </div>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            <span>•</span>
            <span>{post.views} views</span>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Actions */}
          <div className="flex gap-4 pt-8 border-t">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                post.is_liked
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "hover:bg-muted"
              }`}
              disabled={!isLoggedIn || toggleLike.isPending}
            >
              <Heart size={18} className={post.is_liked ? "fill-current" : ""} />
              {post.likes_count}
            </button>
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition"
            >
              <MessageCircle size={18} />
              {post.comments_count}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8 bg-background rounded-xl border p-8">
          <h2 className="text-2xl font-bold mb-6">Comments ({post.comments_count})</h2>

          {isLoggedIn && showCommentForm && (
            <BlogCommentForm
              postId={post.id}
              onSuccess={() => {
                setShowCommentForm(false);
              }}
            />
          )}

          {!isLoggedIn && (
            <div className="text-center py-8 border rounded-lg mb-6">
              <p className="text-muted-foreground mb-4">
                Please log in to leave a comment
              </p>
              <Link to="/login">
                <Button>Log In</Button>
              </Link>
            </div>
          )}

          <BlogCommentList comments={post.comments || []} postId={post.id} />
        </div>
      </div>
    </AppLayout>
  );
}

