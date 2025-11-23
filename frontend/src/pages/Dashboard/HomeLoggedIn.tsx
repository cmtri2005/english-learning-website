import { Button } from "@/shared/components/ui/button";
import { Link } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout";
import {
  BookOpen,
  Mic2,
  Clock,
  Target,
  TrendingUp,
  Star,
  ArrowRight,
  Calendar,
} from "lucide-react";

export default function HomeLoggedIn() {
  const continueLearning = [
    {
      id: 1,
      title: "English A1 Beginner",
      progress: 65,
      lessons: 12,
      totalLessons: 20,
      image: "bg-gradient-to-br from-blue-400 to-blue-600",
    },
    {
      id: 2,
      title: "Listening Skills",
      progress: 45,
      lessons: 9,
      totalLessons: 20,
      image: "bg-gradient-to-br from-purple-400 to-purple-600",
    },
    {
      id: 3,
      title: "Pronunciation Basics",
      progress: 80,
      lessons: 16,
      totalLessons: 20,
      image: "bg-gradient-to-br from-pink-400 to-pink-600",
    },
  ];

  const stats = [
    {
      icon: Clock,
      label: "Hours Learned",
      value: "24.5",
      change: "+2.3h this week",
    },
    {
      icon: Target,
      label: "Lessons Completed",
      value: "37",
      change: "+5 this week",
    },
    {
      icon: TrendingUp,
      label: "Streak Days",
      value: "12",
      change: "Keep it going!",
    },
    {
      icon: Star,
      label: "Achievements",
      value: "8",
      change: "Great progress",
    },
  ];

  const recommendedCourses = [
    {
      id: 1,
      title: "Business English",
      instructor: "Sarah Johnson",
      level: "A2",
      students: 2145,
      rating: 4.8,
    },
    {
      id: 2,
      title: "IELTS Preparation",
      instructor: "David Smith",
      level: "B1",
      students: 1523,
      rating: 4.9,
    },
    {
      id: 3,
      title: "Conversational English",
      instructor: "Emma Wilson",
      level: "A2-B1",
      students: 3421,
      rating: 4.7,
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Live Grammar Workshop",
      date: "Tomorrow at 2:00 PM",
      instructor: "Robert Brown",
    },
    {
      id: 2,
      title: "Speaking Practice Session",
      date: "March 15 at 6:00 PM",
      instructor: "Lisa Anderson",
    },
    {
      id: 3,
      title: "Vocabulary Building Class",
      date: "March 17 at 3:30 PM",
      instructor: "Michael Davis",
    },
  ];

  return (
    <AppLayout>
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
              <p className="text-lg text-muted-foreground">
                Let's continue your English learning journey
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Your Learning Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border bg-background hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="text-primary" size={24} />
                    <span className="text-sm text-green-600 font-semibold">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-muted-foreground text-sm mb-1">
                    {stat.label}
                  </h3>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Continue Learning Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Continue Learning</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Resume your courses where you left off
              </p>
            </div>
            <Link to="/courses">
              <Button variant="outline" size="sm">
                View All Courses
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {continueLearning.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border bg-background overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className={`h-32 ${course.image}`} />
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-sm font-semibold">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {course.lessons} of {course.totalLessons} lessons completed
                  </p>

                  <Button className="w-full" size="sm">
                    Continue Learning
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Upcoming Events & Classes</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Join live sessions to improve your English skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-6 rounded-xl border bg-background hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="text-primary" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.date}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Instructor: {event.instructor}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Register Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Courses Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Recommended For You</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Courses tailored based on your learning goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 rounded-xl border bg-background hover:border-primary/50 transition-colors hover:shadow-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="text-primary" size={20} />
                  <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {course.level}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  by {course.instructor}
                </p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-muted-foreground">
                    {course.students} students
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-500" size={16} fill="currentColor" />
                    <span className="font-semibold">{course.rating}</span>
                  </div>
                </div>

                <Button className="w-full" size="sm">
                  Enroll Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tips Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <div className="flex items-start gap-4">
              <Mic2 className="text-primary flex-shrink-0" size={32} />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Daily Learning Tip</h3>
                <p className="text-muted-foreground mb-4">
                  Consistency is key! Try to spend at least 20-30 minutes daily
                  on English learning. Regular practice will help you maintain
                  your streak and make rapid progress.
                </p>
                <div className="flex gap-3">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Get More Tips
                  </Button>
                  <Button variant="outline" size="sm">
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
