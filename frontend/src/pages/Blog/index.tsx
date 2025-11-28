import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import { MessageCircle, Heart, Share2, Search, Plus, Eye } from "lucide-react";
import { useBlogPosts, useBlogCategories } from "@/store/server/blog-queries";
import { useToggleBlogLike } from "@/store/server/blog-queries";
import { useAuth } from "@/shared/hooks/useAuth";
import BlogPostCard from "./components/BlogPostCard";
import FeaturedPost from "./components/FeaturedPost";
import BlogSearch from "./components/BlogSearch";
import BlogCategories from "./components/BlogCategories";

export default function Blog() {
  const { isLoggedIn } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data, isLoading, error } = useBlogPosts({
    page,
    limit: 10,
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  const { data: categories } = useBlogCategories();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const featuredPost = data?.posts.find((post) => post.is_featured);

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Learning Blog & Community
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Share your English learning journey, discover tips from other
              learners, and contribute to our vibrant community.
            </p>
            {isLoggedIn && (
              <Link to="/blog/create">
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus size={18} />
                  Write a Post
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <BlogSearch onSearch={handleSearch} />
            <BlogCategories
              categories={categories || []}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <FeaturedPost post={featuredPost} />
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Error loading posts. Please try again.</p>
            </div>
          ) : data && data.posts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {data.posts
                  .filter((post) => !post.is_featured)
                  .map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No posts found matching "${searchQuery}"`
                  : "No blog posts yet. Be the first to write one!"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {isLoggedIn && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Share Your Learning Journey
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Have tips to share? Accomplished a learning milestone? Write a blog
              post and inspire other learners.
            </p>
            <Link to="/blog/create">
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus size={18} />
                Create Your Post
              </Button>
            </Link>
          </div>
        </section>
      )}
    </AppLayout>
  );
}

