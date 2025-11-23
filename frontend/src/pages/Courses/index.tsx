import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import { BookOpen, Filter, Search } from "lucide-react";
import { useState } from "react";

export default function Courses() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const skills = ["Listening", "Speaking", "Reading", "Writing"];
  const topics = ["Travel", "Work", "IELTS", "Business", "Daily Life"];

  const coursesData = [
    {
      id: 1,
      title: "A1 Beginner English",
      level: "A1",
      skill: "Listening",
      description: "Start your English journey with basics and fundamentals",
      lessons: 24,
      students: 1203,
    },
    {
      id: 2,
      title: "A1 Beginner English",
      level: "A1",
      skill: "Speaking",
      description: "Build confidence speaking English from day one",
      lessons: 18,
      students: 945,
    },
    {
      id: 3,
      title: "A2 Elementary English",
      level: "A2",
      skill: "Reading",
      description: "Improve your reading skills with engaging texts",
      lessons: 28,
      students: 732,
    },
    {
      id: 4,
      title: "B1 Intermediate English",
      level: "B1",
      skill: "Writing",
      description: "Master writing skills with AI feedback system",
      lessons: 32,
      students: 568,
    },
    {
      id: 5,
      title: "B2 Upper-Intermediate",
      level: "B2",
      skill: "Listening",
      description: "Advanced listening comprehension and nuance",
      lessons: 36,
      students: 421,
    },
    {
      id: 6,
      title: "IELTS Preparation",
      level: "B2",
      skill: "Speaking",
      description: "Prepare for IELTS with focused training",
      lessons: 40,
      students: 892,
    },
  ];

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-primary" size={24} />
              <span className="text-sm font-semibold text-primary">
                EXPLORE COURSES
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Master English at Your Level
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose from courses organized by proficiency level, skill focus,
              and topic. Each course includes theory, examples, and interactive
              practice exercises.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filter Chips */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={18} className="text-muted-foreground" />
                <span className="text-sm font-semibold">Filter by Level</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelectedLevel(selectedLevel === level ? null : level)
                    }
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Skill Filter */}
            <div className="space-y-3">
              <span className="text-sm font-semibold">Filter by Skill</span>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Button
                    key={skill}
                    variant={selectedSkill === skill ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelectedSkill(selectedSkill === skill ? null : skill)
                    }
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {coursesData.map((course) => (
              <div
                key={course.id}
                className="group rounded-xl border bg-background p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {course.level} {course.skill}
                  </span>
                  <span className="text-2xl font-bold text-secondary">
                    {course.lessons}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {course.description}
                </p>

                <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
                  <span>👥 {course.students} students</span>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90">
                  Start Learning
                </Button>
              </div>
            ))}
          </div>

          {/* Coming Soon Note */}
          <div className="text-center py-8 border-t">
            <p className="text-muted-foreground mb-4">
              ✨ More courses coming soon!
            </p>
            <Button variant="outline">Notify Me</Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
