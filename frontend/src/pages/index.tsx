import { Button } from "@/shared/components/ui/button";
import { Link } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout";
import {
  BookOpen,
  Mic2,
  PenTool,
  MessageSquare,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe,
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: BookOpen,
      title: "Structured Courses",
      description:
        "Learn through organized courses from A1 to B2 levels, covering listening, speaking, reading, and writing skills.",
    },
    {
      icon: Mic2,
      title: "Dictation Practice",
      description:
        "Improve your listening and spelling with interactive dictation exercises. Hear native speakers and type what you hear.",
    },
    {
      icon: PenTool,
      title: "AI Writing Feedback",
      description:
        "Get instant AI-powered scoring, detailed feedback, and improvement suggestions for your written work.",
    },
    {
      icon: MessageSquare,
      title: "Discussion Forum",
      description:
        "Real-time Q&A and discussion area. Connect with other learners and get your questions answered instantly.",
    },
    {
      icon: Users,
      title: "Community Blog",
      description:
        "Share your learning journey through blog posts. Contribute to the community with your insights and tips.",
    },
    {
      icon: Sparkles,
      title: "Personalized Learning",
      description:
        "Courses adapted to your level and learning style. Progress through content at your own pace.",
    },
  ];

  const stats = [
    { number: "10K+", label: "Active Learners" },
    { number: "500+", label: "Lessons" },
    { number: "50+", label: "Topics" },
    { number: "24/7", label: "Support" },
  ];

  const coreFeatures = [
    "Create, read, update, delete lessons and content",
    "Role-based access (Admin, Teacher, Student)",
    "Organized by level, skill, and topic",
    "Interactive theory, examples, and exercises",
    "Listen and type practice for every lesson",
  ];

  const roadmapItems = [
    {
      title: "For Learners",
      features: [
        "Browse organized course library",
        "Complete lessons with practice",
        "Get AI feedback on written work",
        "Participate in discussions",
        "Share blog posts",
      ],
    },
    {
      title: "For Teachers",
      features: [
        "Create and manage courses",
        "Track student progress",
        "Provide feedback on assignments",
        "Moderate community content",
        "Analyze learning metrics",
      ],
    },
    {
      title: "For Admins",
      features: [
        "Full content management",
        "User role administration",
        "Approve blog posts",
        "Monitor discussions",
        "Access analytics",
      ],
    },
  ];

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-slide-up">
              <div className="inline-block">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Globe size={16} className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Learn English Your Way
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Master English with{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  AI-Powered Learning
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Structure your learning journey with organized courses from A1
                to B2, interactive lessons, AI-powered feedback, and a vibrant
                community of learners worldwide.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore Courses
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative h-96 md:h-full hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent rounded-2xl" />
              <div className="absolute inset-6 border border-primary/10 rounded-xl" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="space-y-4 w-full px-8">
                  <div className="h-12 bg-primary/10 rounded-lg animate-pulse" />
                  <div className="h-12 bg-secondary/10 rounded-lg animate-pulse delay-100" />
                  <div className="h-12 bg-accent/10 rounded-lg animate-pulse delay-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Learning Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to master English with interactive lessons,
              real-time feedback, and community support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-xl border bg-background hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Learning System
              </h2>
              <p className="text-lg text-muted-foreground">
                Built with educators and learners in mind
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left side - Features list */}
              <div className="space-y-4">
                {coreFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <CheckCircle2 className="text-secondary flex-shrink-0 mt-1" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Right side - Visual */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl" />
                <div className="absolute inset-0 border border-primary/10 rounded-2xl" />
                <div className="relative p-8 space-y-4">
                  <div className="h-4 bg-primary/20 rounded-full w-24" />
                  <div className="space-y-3">
                    <div className="h-3 bg-secondary/10 rounded-full" />
                    <div className="h-3 bg-secondary/10 rounded-full w-5/6" />
                    <div className="h-3 bg-secondary/10 rounded-full w-4/6" />
                  </div>
                  <div className="pt-4 space-y-3">
                    <div className="h-3 bg-accent/10 rounded-full" />
                    <div className="h-3 bg-accent/10 rounded-full w-5/6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-12 md:p-20">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Master English?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Join thousands of learners improving their English skills every
                day with personalized lessons, AI feedback, and community
                support.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Start Learning Today
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Get Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
