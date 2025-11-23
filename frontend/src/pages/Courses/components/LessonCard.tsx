import { Button } from "@/shared/components/ui/button";
import { BookOpen, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

interface LessonCardProps {
  title: string;
  duration: number;
  difficulty:
    | "Beginner"
    | "Elementary"
    | "Intermediate"
    | "Upper-Intermediate"
    | "Advanced";
  description: string;
  completed?: boolean;
  topics: string[];
  onStart?: () => void;
}

export default function LessonCard({
  title,
  duration,
  difficulty,
  description,
  completed = false,
  topics,
  onStart,
}: LessonCardProps) {
  const difficultyColors = {
    Beginner: "bg-green-100 text-green-700",
    Elementary: "bg-blue-100 text-blue-700",
    Intermediate: "bg-yellow-100 text-yellow-700",
    "Upper-Intermediate": "bg-orange-100 text-orange-700",
    Advanced: "bg-red-100 text-red-700",
  };

  return (
    <div
      className={`group rounded-lg border bg-background p-6 hover:border-primary/50 hover:shadow-md transition-all ${
        completed ? "border-secondary/50 bg-secondary/5" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${difficultyColors[difficulty]}`}
            >
              {difficulty}
            </span>
            {completed && (
              <span className="flex items-center gap-1 text-secondary text-xs font-semibold">
                <CheckCircle2 size={14} />
                Completed
              </span>
            )}
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        {completed && <CheckCircle2 className="text-secondary" size={24} />}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock size={16} />
          {duration} min
        </span>
        <span className="flex items-center gap-1">
          <BookOpen size={16} />
          Lesson
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <span
            key={topic}
            className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs"
          >
            #{topic}
          </span>
        ))}
      </div>

      <Button
        className={`w-full ${
          completed
            ? "bg-secondary hover:bg-secondary/90"
            : "bg-primary hover:bg-primary/90"
        }`}
        onClick={onStart}
      >
        {completed ? "Review Lesson" : "Start Lesson"}
        <ChevronRight size={16} className="ml-2" />
      </Button>
    </div>
  );
}
