import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Search, CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";

interface Blog {
  id: number;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  author_name: string;
  author_email: string;
}

export default function AdminModeration() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "draft" | "published" | "archived">("All");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await api.adminRequest<{ blogs: Blog[] }>('/api/admin/blogs');
      if (res.success && res.data) {
        setBlogs(res.data.blogs);
      }
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (blogId: number, newStatus: string) => {
    try {
      const res = await api.adminRequest(`/api/admin/blogs/${blogId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        toast.success(`Blog ${newStatus}`);
        fetchBlogs();
        setSelectedBlog(null);
      } else {
        toast.error(res.message || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update blog');
    }
  };

  const handleDelete = async (blogId: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const res = await api.adminRequest(`/api/admin/blogs/${blogId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        toast.success('Blog deleted');
        fetchBlogs();
        setSelectedBlog(null);
      } else {
        toast.error(res.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchSearch =
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || blog.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-700";
      case "published": return "bg-green-100 text-green-700";
      case "archived": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold">Blog Moderation</h2>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage blog posts
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="All">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Rejected</option>
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Blog List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredBlogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No blogs found
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${selectedBlog?.id === blog.id
                    ? "border-blue-500 bg-blue-50"
                    : "bg-white hover:border-gray-300"
                    }`}
                  onClick={() => setSelectedBlog(blog)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(blog.status)}`}>
                          {blog.status}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{blog.title}</h3>
                      <p className="text-sm text-gray-500">
                        by {blog.author_name || 'Unknown'} • {formatDate(blog.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Blog Preview */}
          {selectedBlog ? (
            <div className="p-5 rounded-lg border bg-white sticky top-6 h-fit">
              <h3 className="font-semibold text-lg mb-3">{selectedBlog.title}</h3>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBlog.status)}`}>
                    {selectedBlog.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Author:</span>
                  <span>{selectedBlog.author_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{formatDate(selectedBlog.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedBlog.status !== 'published' && (
                  <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStatus(selectedBlog.id, 'published')}
                  >
                    <CheckCircle size={16} />
                    Publish
                  </Button>
                )}
                {selectedBlog.status !== 'archived' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-orange-600"
                    onClick={() => handleUpdateStatus(selectedBlog.id, 'archived')}
                  >
                    <XCircle size={16} />
                    Reject
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full gap-2 text-red-600"
                  onClick={() => handleDelete(selectedBlog.id)}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg border bg-gray-50 flex items-center justify-center text-center h-64">
              <p className="text-gray-500">Select a blog to review</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-white">
            <p className="text-sm text-gray-500">Total Blogs</p>
            <p className="text-2xl font-semibold">{blogs.length}</p>
          </div>
          <div className="p-4 rounded-lg border bg-white">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-2xl font-semibold text-green-600">
              {blogs.filter((b) => b.status === "published").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-white">
            <p className="text-sm text-gray-500">Draft</p>
            <p className="text-2xl font-semibold text-yellow-600">
              {blogs.filter((b) => b.status === "draft").length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

