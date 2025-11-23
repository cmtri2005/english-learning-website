import { Button } from "@/shared/components/ui/button";
import { BookOpen, Users } from "lucide-react";

interface CourseCardProps {
  title: string;
  level: string;
  skill: string;
  description: string;
  lessons: number;
  students: number;
  progress?: number;
  onStart?: () => void;
  variant?: "default" | "compact";
}

export default function CourseCard({
  title,
  level,
  skill,
  description,
  lessons,
  students,
  progress,
  onStart,
  variant = "default",
}: CourseCardProps) {
  if (variant === "compact") {
    return (
      <div className="rounded-lg border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="text-primary" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-1">{title}</h4>
            <p className="text-xs text-muted-foreground">{level}</p>
          </div>
        </div>
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress}% done</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group rounded-xl border bg-background p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            {level} {skill}
          </span>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <span className="text-2xl font-bold text-secondary">{lessons}</span>
      </div>

      <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
        {description}
      </p>

      <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen size={16} />
          {lessons} lessons
        </span>
        <span className="flex items-center gap-1">
          <Users size={16} />
          {students} students
        </span>
      </div>

      {progress !== undefined && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium">Progress</span>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        className="w-full bg-primary hover:bg-primary/90"
        onClick={onStart}
      >
        {progress ? "Continue Learning" : "Start Learning"}
      </Button>
    </div>
  );
}
