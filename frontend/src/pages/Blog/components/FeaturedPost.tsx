import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import type { BlogPost } from "@/services/blog/blog-api";
import { formatDistanceToNow } from "date-fns";

interface FeaturedPostProps {
  post: BlogPost;
}

export default function FeaturedPost({ post }: FeaturedPostProps) {
  const gradientClass = `bg-gradient-to-br from-primary/20 to-primary/5`;

  return (
    <div className="rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-48 md:h-64 ${gradientClass}`} />
      <div className="p-8 bg-background">
        <div className="flex gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {post.category}
          </span>
          <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
            Featured
          </span>
        </div>
        <h2 className="text-3xl font-bold mb-3">{post.title}</h2>
        <p className="text-muted-foreground mb-4 text-lg">{post.excerpt}</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            By <span className="font-semibold">{post.author_name}</span>{" "}
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </div>
          <Link to={`/blog/${post.slug}`}>
            <Button variant="outline">Read More</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

