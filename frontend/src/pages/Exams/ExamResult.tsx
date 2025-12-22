import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { examService, ExamResult, ExamQuestion } from "@/services/exam.service";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { AppLayout } from "@/shared/components/layout";

type FilterType = 'all' | 'correct' | 'incorrect';

export function ExamResultPage() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (attemptId) {
            examService.getExamResult(parseInt(attemptId)).then((response) => {
                if (response.success && response.data) {
                    setResult(response.data);
                }
                setLoading(false);
            });
        }
    }, [attemptId]);

    const stats = useMemo(() => {
        if (!result) return { total: 0, correct: 0, incorrect: 0, percentage: 0 };
        const questions = result.questions || [];
        const total = questions.length;
        const correct = questions.filter(q => q.is_correct).length;
        const incorrect = total - correct;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { total, correct, incorrect, percentage };
    }, [result]);

    const filteredQuestions = useMemo(() => {
        if (!result) return [];
        return result.questions.filter(q => {
            if (filter === 'all') return true;
            if (filter === 'correct') return q.is_correct;
            if (filter === 'incorrect') return !q.is_correct;
            return true;
        });
    }, [result, filter]);

    const toggleExplanation = (questionId: number) => {
        setExpandedExplanations(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-500">Đang tải kết quả...</p>
                </div>
            </AppLayout>
        );
    }

    if (!result) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-red-500">Không thể tải kết quả bài thi</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Kết quả bài thi</h1>
                                <p className="text-gray-500 text-sm mt-1">Chi tiết đáp án và giải thích</p>
                            </div>
                            <Link
                                to="/exams"
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại danh sách
                            </Link>
                        </div>

                        {/* Score Section */}
                        <div className="grid grid-cols-3 gap-8 max-w-2xl">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Listening</div>
                                <div className="text-3xl font-semibold text-gray-900">{result.attempt.score_listening}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reading</div>
                                <div className="text-3xl font-semibold text-gray-900">{result.attempt.score_reading}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tổng điểm</div>
                                <div className="text-3xl font-bold text-gray-900">{result.attempt.total_score}</div>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="mt-8 flex items-center gap-6 text-sm">
                            <span className="text-gray-600">
                                <span className="font-medium text-gray-900">{stats.total}</span> câu hỏi
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-green-600">
                                <span className="font-medium">{stats.correct}</span> đúng
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-red-600">
                                <span className="font-medium">{stats.incorrect}</span> sai
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-600">
                                <span className="font-medium text-gray-900">{stats.percentage}%</span> chính xác
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-6">
                    {/* Filter */}
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-sm text-gray-500 mr-2">Lọc:</span>
                        {(['all', 'correct', 'incorrect'] as FilterType[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                                    filter === f
                                        ? "bg-gray-900 text-white"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                                )}
                            >
                                {f === 'all' && `Tất cả (${stats.total})`}
                                {f === 'correct' && `Đúng (${stats.correct})`}
                                {f === 'incorrect' && `Sai (${stats.incorrect})`}
                            </button>
                        ))}
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                        {filteredQuestions.map(q => (
                            <QuestionCard
                                key={q.question_id}
                                question={q}
                                isExpanded={expandedExplanations.has(q.question_id)}
                                onToggle={() => toggleExplanation(q.question_id)}
                            />
                        ))}
                    </div>

                    {filteredQuestions.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Không có câu hỏi nào phù hợp với bộ lọc.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function QuestionCard({
    question,
    isExpanded,
    onToggle
}: {
    question: ExamQuestion;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const isCorrect = question.is_correct;
    const hasOptions = question.options && question.options.length > 0;

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-4 p-4">
                {/* Question Number */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                    isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                    {question.question_number}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Part info */}
                    {question.part_number && (
                        <div className="text-xs text-gray-400 mb-1">
                            Part {question.part_number}
                            {question.question_type && ` · ${question.question_type}`}
                        </div>
                    )}

                    {/* Question text */}
                    {question.question_text && (
                        <p className="text-gray-800 mb-3 whitespace-pre-wrap">
                            {question.question_text}
                        </p>
                    )}

                    {/* Media */}
                    {(question.image_urls?.length || question.audio_urls?.length) && (
                        <div className="mb-3 space-y-2">
                            {question.image_urls?.map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt=""
                                    className="max-h-48 rounded border border-gray-200"
                                />
                            ))}
                            {question.audio_urls?.map((url, i) => (
                                <audio key={i} controls src={url} className="max-w-sm" />
                            ))}
                        </div>
                    )}

                    {/* Options */}
                    {hasOptions && (
                        <div className="space-y-1.5 mb-3">
                            {question.options?.map(opt => {
                                const isSelected = opt === question.user_selected;
                                const isAnswer = opt === question.correct_answer;

                                return (
                                    <div
                                        key={opt}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded text-sm",
                                            isAnswer && "bg-green-50 text-green-800",
                                            isSelected && !isAnswer && "bg-red-50 text-red-800",
                                            !isSelected && !isAnswer && "text-gray-600"
                                        )}
                                    >
                                        {isAnswer && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
                                        {isSelected && !isAnswer && <XCircle size={14} className="text-red-600 flex-shrink-0" />}
                                        {!isAnswer && !isSelected && <span className="w-3.5" />}
                                        <span>{opt}</span>
                                        {isAnswer && <span className="ml-auto text-xs text-green-600">Đáp án</span>}
                                        {isSelected && !isAnswer && <span className="ml-auto text-xs text-red-500">Bạn chọn</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Answer summary for non-multiple choice */}
                    {!hasOptions && (
                        <div className="text-sm text-gray-600 mb-3">
                            <span className="text-gray-500">Đáp án: </span>
                            <span className="text-green-700 font-medium">{question.correct_answer || "N/A"}</span>
                        </div>
                    )}

                    {/* Explanation toggle */}
                    <button
                        onClick={onToggle}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? "Ẩn giải thích" : "Xem giải thích"}
                    </button>

                    {/* Explanation */}
                    {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {question.explanation || "Chưa có giải thích cho câu hỏi này."}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                    {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                    )}
                </div>
            </div>
        </div>
    );
}

