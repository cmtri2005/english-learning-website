import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Award,
  FileText,
  Settings,
  LogOut,
  BookOpen,
  Trophy,
  Target,
  Headphones,
  Mic,
  PenTool,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { examService, ExamAttemptSummary } from "@/services/exam.service";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email || "Student";

  // Real exam data state
  const [attempts, setAttempts] = useState<ExamAttemptSummary[]>([]);
  const [stats, setStats] = useState({
    total_attempts: 0,
    best_score: 0,
    avg_score: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getMyAttempts().then((response) => {
      if (response.success && response.data) {
        setAttempts(response.data.attempts);
        setStats(response.data.stats);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getExamTypeIcon = (type: string) => {
    switch (type) {
      case 'readlis': return <Headphones className="w-4 h-4" />;
      case 'speaking': return <Mic className="w-4 h-4" />;
      case 'writting': return <PenTool className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'readlis': return 'Listening & Reading';
      case 'speaking': return 'Speaking';
      case 'writting': return 'Writing';
      default: return 'TOEIC';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userStats = [
    {
      label: "Exams Completed",
      value: stats.total_attempts.toString(),
      icon: FileText,
      color: "text-blue-500",
    },
    {
      label: "Best Score",
      value: stats.best_score.toString(),
      icon: Trophy,
      color: "text-yellow-500",
    },
    {
      label: "Average Score",
      value: stats.avg_score.toString(),
      icon: Target,
      color: "text-green-500",
    },
    {
      label: "Total Points",
      value: (stats.total_attempts * stats.avg_score).toString(),
      icon: Award,
      color: "text-purple-500",
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
                Welcome back, {displayName}! 👋
              </h1>
              <p className="text-muted-foreground">
                Track your progress and master English with TOEIC practice tests
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/settings')}>
                <Settings size={16} />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {["Overview", "Exam History", "Analytics"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === tab.toLowerCase().replace(' ', '-')
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
                    <p className="text-3xl font-bold">{loading ? "..." : stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Exams and Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Recent Exam Attempts */}
              <div className="md:col-span-2 p-6 rounded-xl border bg-background">
                <h3 className="text-xl font-semibold mb-6">Recent Exam Results</h3>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't taken any exams yet</p>
                    <Link to="/exams">
                      <Button>Start Your First Exam</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attempts.slice(0, 5).map((attempt) => (
                      <Link
                        key={attempt.attempt_id}
                        to={`/exams/result/${attempt.attempt_id}`}
                        className="block"
                      >
                        <div className="flex justify-between items-center p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {getExamTypeIcon(attempt.exam_type)}
                            </div>
                            <div>
                              <h4 className="font-semibold">{attempt.exam_title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {getExamTypeLabel(attempt.exam_type)} • {formatDate(attempt.end_time)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{attempt.total_score}</p>
                            <p className="text-xs text-muted-foreground">
                              L: {attempt.score_listening} | R: {attempt.score_reading}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-xl border bg-background">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/exams">
                    <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90">
                      <BookOpen size={18} />
                      Practice Exams
                    </Button>
                  </Link>
                  <Link to="/practice">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Mic size={18} />
                      Speaking & Writing
                    </Button>
                  </Link>
                  <Link to="/blog">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <FileText size={18} />
                      Read Blog
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 size={18} />
                    View Analytics
                  </Button>
                </div>

                {/* Progress Summary */}
                {stats.total_attempts > 0 && (
                  <div className="mt-6 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <p className="text-sm font-semibold text-secondary mb-1">
                      🎯 Keep Practicing!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You've completed {stats.total_attempts} exams with an average score of {stats.avg_score}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Exam History Tab */}
      {activeTab === "exam-history" && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Exam History</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-16 bg-muted/50 rounded-xl">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No exam history yet</h3>
                <p className="text-muted-foreground mb-6">Start practicing to see your progress here</p>
                <Link to="/exams">
                  <Button size="lg">Browse Exams</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <Link
                    key={attempt.attempt_id}
                    to={`/exams/result/${attempt.attempt_id}`}
                    className="block"
                  >
                    <div className="flex justify-between items-center p-6 rounded-xl border bg-background hover:border-primary/50 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                          {getExamTypeIcon(attempt.exam_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{attempt.exam_title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getExamTypeLabel(attempt.exam_type)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {formatDate(attempt.end_time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{attempt.total_score}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span>Listening: {attempt.score_listening}</span>
                          <span>Reading: {attempt.score_reading}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Your Analytics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <div className="p-6 rounded-xl border bg-background">
                <h3 className="font-semibold mb-4">Score Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Total Exams</span>
                      <span className="text-sm text-primary font-bold">{stats.total_attempts}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Best Score</span>
                      <span className="text-sm text-green-500 font-bold">{stats.best_score}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full"
                        style={{ width: `${(stats.best_score / 990) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-sm text-blue-500 font-bold">{stats.avg_score}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full"
                        style={{ width: `${(stats.avg_score / 990) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Scores Chart */}
              <div className="p-6 rounded-xl border bg-background">
                <h3 className="font-semibold mb-4">Recent Scores</h3>
                {attempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Complete some exams to see your progress chart
                  </p>
                ) : (
                  <div className="flex items-end gap-2 h-40">
                    {attempts.slice(0, 7).reverse().map((attempt, i) => (
                      <div
                        key={attempt.attempt_id}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-primary to-secondary rounded-t transition-all hover:opacity-80"
                          style={{
                            height: `${(attempt.total_score / 990) * 100}%`,
                            minHeight: "4px",
                          }}
                          title={`Score: ${attempt.total_score}`}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </AppLayout>
  );
}

