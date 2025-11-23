import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Search, CheckCircle, XCircle, Flag, MessageCircle } from "lucide-react";
import { useState } from "react";

interface Content {
  id: number;
  type: "Blog Post" | "Forum Thread" | "Comment";
  title: string;
  author: string;
  content: string;
  submittedDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Flagged";
}

export default function AdminModeration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected" | "Flagged">("All");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  const contents: Content[] = [
    {
      id: 1,
      type: "Blog Post",
      title: "10 Tips for Learning English Faster",
      author: "John Smith",
      content:
        "In this blog post, I'll share 10 proven tips that have helped me and many others improve their English speaking and writing skills. Consistency is key when learning a new language...",
      submittedDate: "2024-03-10",
      status: "Pending",
    },
    {
      id: 2,
      type: "Forum Thread",
      title: "Questions about English Grammar",
      author: "Jane Doe",
      content:
        "I'm having trouble understanding the difference between present perfect and simple past. Can anyone help me understand when to use each tense?",
      submittedDate: "2024-03-09",
      status: "Flagged",
    },
    {
      id: 3,
      type: "Blog Post",
      title: "My English Learning Journey",
      author: "Tom Wilson",
      content:
        "I started learning English 6 months ago and it has been an amazing journey. This platform has been instrumental in my progress. Here are some of the lessons that have helped me...",
      submittedDate: "2024-03-08",
      status: "Pending",
    },
    {
      id: 4,
      type: "Comment",
      title: "Comment on: Speaking Practice Tips",
      author: "Maria Garcia",
      content:
        "Great article! I've been following these tips and they really work. My pronunciation has improved significantly.",
      submittedDate: "2024-03-07",
      status: "Approved",
    },
    {
      id: 5,
      type: "Forum Thread",
      title: "Inappropriate content posted",
      author: "Alex Turner",
      content: "[Flagged due to inappropriate language]",
      submittedDate: "2024-03-06",
      status: "Rejected",
    },
    {
      id: 6,
      type: "Blog Post",
      title: "Best Podcasts for English Learners",
      author: "Sophie Brown",
      content:
        "I've compiled a list of the best podcasts for English learners at different levels. These podcasts cover various topics and help improve listening skills...",
      submittedDate: "2024-03-05",
      status: "Approved",
    },
  ];

  const filteredContents = contents.filter((content) => {
    const matchSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "All" || content.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Flagged":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Blog Post":
        return "bg-blue-100 text-blue-700";
      case "Forum Thread":
        return "bg-purple-100 text-purple-700";
      case "Comment":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold mb-2">Content Moderation</h2>
          <p className="text-muted-foreground">
            Review, approve, and moderate user-generated content
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Flagged</option>
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Content List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedContent?.id === content.id
                    ? "border-primary bg-primary/5"
                    : "bg-background hover:border-primary/50"
                }`}
                onClick={() => setSelectedContent(content)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getTypeColor(
                          content.type
                        )}`}
                      >
                        {content.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(
                          content.status
                        )}`}
                      >
                        {content.status}
                      </span>
                      {content.status === "Flagged" && (
                        <Flag className="text-orange-600" size={14} />
                      )}
                    </div>
                    <h3 className="font-semibold text-base mb-1">
                      {content.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      by {content.author} on {content.submittedDate}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Preview */}
          {selectedContent ? (
            <div className="p-6 rounded-lg border bg-background sticky top-6 h-fit">
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">{selectedContent.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${getTypeColor(
                      selectedContent.type
                    )}`}
                  >
                    {selectedContent.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(
                      selectedContent.status
                    )}`}
                  >
                    {selectedContent.status}
                  </span>
                </div>
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground mb-1">Author</p>
                <p className="font-semibold">{selectedContent.author}</p>
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground mb-1">Content</p>
                <p className="text-sm leading-relaxed">
                  {selectedContent.content}
                </p>
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground">
                  Submitted: {selectedContent.submittedDate}
                </p>
              </div>

              {/* Action Buttons */}
              {selectedContent.status === "Pending" ||
              selectedContent.status === "Flagged" ? (
                <div className="space-y-2">
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle size={18} />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-600"
                  >
                    <XCircle size={18} />
                    Reject
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle size={18} />
                    Send Message
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm font-semibold">
                    {selectedContent.status === "Approved"
                      ? "✓ Content Approved"
                      : "✗ Content Rejected"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-lg border bg-muted/30 flex items-center justify-center text-center h-96">
              <div>
                <p className="text-lg font-semibold mb-2">
                  Select content to review
                </p>
                <p className="text-sm text-muted-foreground">
                  Click on any content item to view details and take action
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Total Content</p>
            <p className="text-2xl font-bold">{contents.length}</p>
          </div>
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">
              {contents.filter((c) => c.status === "Pending").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Flagged</p>
            <p className="text-2xl font-bold text-orange-600">
              {contents.filter((c) => c.status === "Flagged").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {contents.filter((c) => c.status === "Approved").length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
