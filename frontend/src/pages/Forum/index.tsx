import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import {
  MessageCircle,
  Eye,
  Reply,
  Plus,
  Search,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useState } from "react";

export default function Forum() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "general", name: "General Discussion", count: 234 },
    { id: "grammar", name: "Grammar Questions", count: 156 },
    { id: "vocabulary", name: "Vocabulary Help", count: 189 },
    { id: "pronunciation", name: "Pronunciation", count: 78 },
    { id: "practice", name: "Practice Partners", count: 324 },
  ];

  const forumThreads = [
    {
      id: 1,
      title: 'What is the difference between "will" and "going to"?',
      category: "grammar",
      author: "Alex Rodriguez",
      replies: 12,
      views: 523,
      lastActivity: "2 hours ago",
      isPinned: true,
      tags: ["grammar", "tense", "future"],
    },
    {
      id: 2,
      title: "Best resources for IELTS listening practice?",
      category: "practice",
      author: "Emma Stone",
      replies: 8,
      views: 312,
      lastActivity: "4 hours ago",
      isPinned: false,
      tags: ["IELTS", "listening", "resources"],
    },
    {
      id: 3,
      title: "How to improve pronunciation naturally?",
      category: "pronunciation",
      author: "David Kim",
      replies: 15,
      views: 678,
      lastActivity: "1 hour ago",
      isPinned: false,
      tags: ["pronunciation", "accent", "speaking"],
    },
    {
      id: 4,
      title: "Looking for practice partners at B1 level",
      category: "practice",
      author: "Sofia Martinez",
      replies: 23,
      views: 891,
      lastActivity: "30 minutes ago",
      isPinned: false,
      tags: ["practice", "speaking", "partner"],
    },
    {
      id: 5,
      title: "Common phrasal verbs to master",
      category: "vocabulary",
      author: "James Wilson",
      replies: 19,
      views: 742,
      lastActivity: "3 hours ago",
      isPinned: false,
      tags: ["phrasal-verbs", "vocabulary", "idioms"],
    },
    {
      id: 6,
      title: "Using articles (a, an, the) correctly - tips?",
      category: "grammar",
      author: "Lisa Zhang",
      replies: 11,
      views: 456,
      lastActivity: "5 hours ago",
      isPinned: false,
      tags: ["articles", "grammar", "common-mistakes"],
    },
  ];

  const filteredThreads = forumThreads.filter((thread) => {
    const matchesSearch = thread.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || thread.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="text-primary" size={24} />
              <span className="text-sm font-semibold text-primary">
                COMMUNITY FORUM
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Real-Time Discussion & Q&A
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Ask questions, share knowledge, and connect with fellow English
              learners. Get instant feedback and support from our community.
            </p>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus size={18} />
              Start New Discussion
            </Button>
          </div>
        </div>
      </section>

      {/* Search & Categories */}
      <section className="py-8 border-b bg-muted/30 sticky top-16 z-30">
        <div className="container mx-auto px-4 space-y-6">
          {/* Search */}
          <div className="relative max-w-2xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id,
                  )
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Threads List */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {filteredThreads.length > 0 ? (
            <div className="space-y-3">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="border rounded-lg p-4 md:p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex gap-4">
                    {/* Left Stats */}
                    <div className="hidden sm:flex flex-col items-center text-center min-w-[80px]">
                      <div className="text-2xl font-bold text-secondary mb-1">
                        {thread.replies}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        replies
                      </div>
                      <div className="text-lg font-semibold text-primary">
                        {thread.views}
                      </div>
                      <div className="text-xs text-muted-foreground">views</div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        {thread.isPinned && (
                          <span className="px-2 py-1 rounded text-primary bg-primary/10 text-xs font-semibold">
                            📌 Pinned
                          </span>
                        )}
                        <span className="px-2 py-1 rounded text-secondary bg-secondary/10 text-xs font-semibold">
                          {
                            categories.find((c) => c.id === thread.category)
                              ?.name
                          }
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {thread.title}
                      </h3>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {thread.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>By {thread.author}</span>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {thread.lastActivity}
                        </div>
                      </div>
                    </div>

                    {/* Reply Button */}
                    <div className="hidden md:flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 group-hover:bg-primary/10 group-hover:text-primary"
                      >
                        <Reply size={16} />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle
                className="mx-auto mb-4 text-muted-foreground opacity-50"
                size={48}
              />
              <p className="text-muted-foreground mb-4">
                No discussions found. Try adjusting your filters.
              </p>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus size={18} />
                Start a Discussion
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filteredThreads.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-8 pt-8 border-t">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page 1 of 8</span>
              <Button size="sm">Next</Button>
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-secondary" size={24} />
            <h2 className="text-2xl font-bold">Trending Topics</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              "IELTS Preparation",
              "Speaking Practice",
              "Grammar Tips",
              "Vocabulary Building",
              "Pronunciation Help",
              "Business English",
            ].map((topic) => (
              <button
                key={topic}
                className="p-4 rounded-lg border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="font-semibold mb-1">{topic}</div>
                <div className="text-sm text-muted-foreground">
                  Join the conversation →
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">Community Guidelines</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-2">Be Respectful</h3>
              <p className="text-sm text-muted-foreground">
                Treat all community members with kindness and respect.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-2">Stay On Topic</h3>
              <p className="text-sm text-muted-foreground">
                Keep discussions relevant to English learning.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-2">Search Before Posting</h3>
              <p className="text-sm text-muted-foreground">
                Check if your question has already been answered.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-2">No Spam or Advertising</h3>
              <p className="text-sm text-muted-foreground">
                Commercial content is not allowed without prior approval.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
