import { Link } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight, BookOpen, Globe2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <AppLayout>
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-secondary/10">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            {/* Left - Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
                <Sparkles className="mr-1 h-3 w-3" />
                Learn English smarter, not harder
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Master English with{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Monolingo
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                Personalized English courses, real-life practice, and progress tracking
                to help you become confident in speaking, listening, reading, and writing.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="gap-2">
                    I already have an account
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-primary" />
                  <span>Interactive lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Structured learning paths</span>
                </div>
              </div>
            </div>

            {/* Right - Illustration / Stats */}
            <div className="relative">
              <div className="absolute -top-8 -right-4 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-secondary/10 blur-2xl" />

              <div className="relative p-6 md:p-8 rounded-3xl border bg-background/80 backdrop-blur shadow-lg space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active learners</p>
                    <p className="text-2xl font-bold">2,300+</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Average progress</p>
                    <p className="text-2xl font-bold text-primary">78%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl border bg-muted/40">
                    <p className="text-muted-foreground mb-1 text-xs">Skills</p>
                    <p className="font-semibold">Listening &amp; Speaking</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Real-life conversations &amp; practice
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-muted/40">
                    <p className="text-muted-foreground mb-1 text-xs">Goals</p>
                    <p className="font-semibold">IELTS &amp; Business English</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exam prep &amp; professional communication
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Track your daily streaks and achievements 🔥</span>
                  <span className="font-medium text-primary">Start today</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
