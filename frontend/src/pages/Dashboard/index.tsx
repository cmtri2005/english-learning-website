import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  Settings,
  LogOut,
  BookOpen,
  Clock,
} from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const userStats = [
    {
      label: "Learning Streak",
      value: "12 days",
      icon: Calendar,
      color: "text-secondary",
    },
    {
      label: "Lessons Completed",
      value: "47",
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Total Hours",
      value: "124.5",
      icon: Clock,
      color: "text-accent",
    },
    {
      label: "Achievement Points",
      value: "2,340",
      icon: Award,
      color: "text-secondary",
    },
  ];

  const recentLessons = [
    {
      id: 1,
      name: "Present Perfect Tense",
      course: "B1 Intermediate",
      progress: 100,
      status: "Completed",
    },
    {
      id: 2,
      name: "Business Email Writing",
      course: "B2 Upper-Intermediate",
      progress: 75,
      status: "In Progress",
    },
    {
      id: 3,
      name: "IELTS Listening Strategy",
      course: "IELTS Preparation",
      progress: 40,
      status: "In Progress",
    },
  ];

  const achievements = [
    {
      title: "Starter",
      description: "Complete your first lesson",
      unlocked: true,
    },
    {
      title: "Consistent Learner",
      description: "7-day learning streak",
      unlocked: true,
    },
    {
      title: "Grammar Master",
      description: "Complete all grammar lessons",
      unlocked: false,
    },
    {
      title: "Speaking Champion",
      description: "Complete all speaking lessons",
      unlocked: false,
    },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Welcome back, Alex! 👋
              </h1>
              <p className="text-muted-foreground">
                Keep up your learning streak and master English
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings size={16} />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {["Overview", "Learning", "Achievements", "Analytics"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {userStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl border bg-background hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className={`${stat.color} mb-2`}>
                      <Icon size={24} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Progress and Recent Activity */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Current Course Progress */}
              <div className="md:col-span-2 p-6 rounded-xl border bg-background">
                <h3 className="text-xl font-semibold mb-6">Current Learning</h3>
                <div className="space-y-6">
                  {recentLessons.map((lesson) => (
                    <div key={lesson.id}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{lesson.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {lesson.course}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium px-3 py-1 rounded-full ${
                            lesson.status === "Completed"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {lesson.status}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {lesson.progress}% completed
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-xl border bg-background">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90">
                    <BookOpen size={18} />
                    Continue Learning
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <BarChart3 size={18} />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <TrendingUp size={18} />
                    Weekly Goals
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Award size={18} />
                    My Achievements
                  </Button>
                </div>

                {/* Streak Info */}
                <div className="mt-6 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <p className="text-sm font-semibold text-secondary mb-1">
                    🔥 12 Day Streak!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Keep practicing every day to maintain your streak
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Learning Tab */}
      {activeTab === "learning" && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">My Learning Path</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "Grammar Fundamentals",
                "Listening Mastery",
                "Speaking Confidence",
                "Writing Skills",
                "Vocabulary Builder",
                "IELTS Preparation",
              ].map((course, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border bg-background hover:border-primary/50 transition-all"
                >
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center">
                    <BookOpen className="text-primary/50" size={40} />
                  </div>
                  <h3 className="font-semibold mb-2">{course}</h3>
                  <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-full"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 100)}% Complete
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">My Achievements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border ${
                    achievement.unlocked
                      ? "bg-background border-secondary/30"
                      : "bg-muted/50 border-muted opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`text-3xl flex items-center justify-center w-16 h-16 rounded-lg ${
                        achievement.unlocked ? "bg-secondary/20" : "bg-muted/30"
                      }`}
                    >
                      {achievement.unlocked ? "🏆" : "🔒"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && (
                        <p className="text-xs text-secondary font-semibold mt-2">
                          ✓ Unlocked
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Your Learning Analytics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-background">
                <h3 className="font-semibold mb-4">Weekly Activity</h3>
                <div className="flex items-end gap-2 h-40">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, i) => (
                      <div
                        key={day}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-primary to-secondary rounded-t transition-all hover:opacity-80"
                          style={{
                            height: `${(i + 1) * 15}%`,
                            minHeight: "4px",
                          }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          {day}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-background">
                <h3 className="font-semibold mb-4">Skills Progress</h3>
                <div className="space-y-4">
                  {["Listening", "Speaking", "Reading", "Writing"].map(
                    (skill) => (
                      <div key={skill}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{skill}</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 40 + 40)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-full"
                            style={{
                              width: `${Math.floor(Math.random() * 40 + 40)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </AppLayout>
  );
}
