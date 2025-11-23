import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { AppLayout } from "@/shared/components/layout";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateBlogPost, useUpdateBlogPost, useBlogPost } from "@/store/server/blog-queries";
import { useAuth } from "@/shared/hooks/useAuth";
import { Link } from "react-router-dom";

export default function CreatePost() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const isEdit = !!id;

  const { data: existingPost } = useBlogPost(id ? parseInt(id) : 0);

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("General");
  const [featuredImage, setFeaturedImage] = useState("");

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setExcerpt(existingPost.excerpt);
      setCategory(existingPost.category);
      setFeaturedImage(existingPost.featured_image || "");
    }
  }, [existingPost]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit && id) {
        await updatePost.mutateAsync({
          id: parseInt(id),
          data: { title, content, excerpt, category, featured_image: featuredImage },
        });
      } else {
        await createPost.mutateAsync({
          title,
          content,
          excerpt,
          category,
          featured_image: featuredImage,
        });
      }
      navigate("/blog");
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  const categories = [
    "General",
    "Learning Tips",
    "Technology",
    "Methodology",
    "IELTS",
    "Vocabulary",
    "Grammar",
    "Pronunciation",
  ];

  if (!isLoggedIn) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/blog">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft size={16} />
            Back to Blog
          </Button>
        </Link>

        <div className="bg-background rounded-xl border p-8">
          <h1 className="text-3xl font-bold mb-8">
            {isEdit ? "Edit Post" : "Create New Post"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full px-3 py-2 border rounded-lg bg-background"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of your post..."
                className="mt-2 min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty to auto-generate from content
              </p>
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here... (HTML supported)"
                required
                className="mt-2 min-h-[300px] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="featuredImage">Featured Image URL (optional)</Label>
              <Input
                id="featuredImage"
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createPost.isPending || updatePost.isPending}
                className="gap-2"
              >
                <Save size={16} />
                {createPost.isPending || updatePost.isPending
                  ? "Saving..."
                  : isEdit
                  ? "Update Post"
                  : "Publish Post"}
              </Button>
              <Link to="/blog">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

