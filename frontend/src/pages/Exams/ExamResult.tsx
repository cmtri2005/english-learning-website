import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { examService, ExamResult, ExamQuestion, ExamQuestionGroup } from "@/services/exam.service";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Filter, Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { AppLayout } from "@/shared/components/layout";

type FilterType = 'all' | 'correct' | 'incorrect';

export function ExamResultPage() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());
    const [showAllExplanations, setShowAllExplanations] = useState(false);

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

    // Calculate statistics
    const stats = useMemo(() => {
        if (!result) return { total: 0, correct: 0, incorrect: 0, unanswered: 0, percentage: 0 };

        const questions = result.questions || [];
        const total = questions.length;
        const correct = questions.filter(q => q.is_correct).length;
        const unanswered = questions.filter(q => !q.user_selected).length;
        const incorrect = total - correct;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return { total, correct, incorrect, unanswered, percentage };
    }, [result]);

    // Organize questions by part and group for display
    const organizedData = useMemo(() => {
        if (!result) return { parts: {} as Record<number, Array<{ type: 'group' | 'question', data: ExamQuestionGroup | ExamQuestion }>> };

        const parts: Record<number, Array<{ type: 'group' | 'question', data: ExamQuestionGroup | ExamQuestion }>> = {};
        const groupMap = new Map<number, ExamQuestionGroup>();

        // Build group map with questions
        if (result.groups) {
            result.groups.forEach(g => {
                groupMap.set(g.group_id, { ...g, questions: [] });
            });
        }

        // Assign questions to groups or standalone
        const standaloneQuestions: ExamQuestion[] = [];
        const questionsInGroups = new Set<number>();

        result.questions.forEach(q => {
            const groupId = (q as any).group_id;
            if (groupId && groupMap.has(groupId)) {
                const group = groupMap.get(groupId)!;
                group.questions.push(q);
                questionsInGroups.add(q.question_id);
            } else {
                standaloneQuestions.push(q);
            }
        });

        // Organize by part
        groupMap.forEach(group => {
            if (group.questions.length > 0) {
                const partNum = group.part_number;
                if (!parts[partNum]) parts[partNum] = [];
                parts[partNum].push({ type: 'group', data: group });
            }
        });

        standaloneQuestions.forEach(q => {
            const partNum = q.part_number;
            if (!parts[partNum]) parts[partNum] = [];
            parts[partNum].push({ type: 'question', data: q });
        });

        // Sort each part by question number
        Object.keys(parts).forEach(k => {
            const partNum = parseInt(k);
            parts[partNum].sort((a, b) => {
                const qNumA = a.type === 'group'
                    ? (a.data as ExamQuestionGroup).questions[0]?.question_number || 0
                    : (a.data as ExamQuestion).question_number;
                const qNumB = b.type === 'group'
                    ? (b.data as ExamQuestionGroup).questions[0]?.question_number || 0
                    : (b.data as ExamQuestion).question_number;
                return qNumA - qNumB;
            });
        });

        return { parts };
    }, [result]);

    // Filter questions based on filter type
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

    const toggleAllExplanations = () => {
        if (showAllExplanations) {
            setExpandedExplanations(new Set());
        } else {
            setExpandedExplanations(new Set(result?.questions.map(q => q.question_id) || []));
        }
        setShowAllExplanations(!showAllExplanations);
    };

    if (loading) return <AppLayout><div className="p-8 flex justify-center">Đang tải kết quả...</div></AppLayout>;
    if (!result) return <AppLayout><div className="p-8 text-red-500 text-center">Không thể tải kết quả bài thi</div></AppLayout>;

    return (
        <AppLayout>
            <div className="container mx-auto py-8 px-4">
                {/* Score Summary Card */}
                <Card className="mb-8 border-t-8 border-t-green-500 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-center text-3xl font-bold text-gray-800">Kết Quả Bài Thi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* TOEIC Scores */}
                        <div className="flex justify-center gap-12 text-center py-6 border-b mb-6">
                            <div className="px-8 py-4 bg-blue-50 rounded-xl">
                                <div className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Listening</div>
                                <div className="text-4xl font-bold text-blue-600">{result.attempt.score_listening}</div>
                            </div>
                            <div className="px-8 py-4 bg-green-50 rounded-xl">
                                <div className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Reading</div>
                                <div className="text-4xl font-bold text-green-600">{result.attempt.score_reading}</div>
                            </div>
                            <div className="px-10 py-4 bg-purple-50 rounded-xl">
                                <div className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Tổng điểm</div>
                                <div className="text-5xl font-bold text-purple-600">{result.attempt.total_score}</div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
                                <div className="text-sm text-gray-500">Tổng số câu</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                                <div className="text-sm text-green-700">Câu đúng</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-3xl font-bold text-red-600">{stats.incorrect}</div>
                                <div className="text-sm text-red-700">Câu sai</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-3xl font-bold text-blue-600">{stats.percentage}%</div>
                                <div className="text-sm text-blue-700">Tỷ lệ đúng</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                                    style={{ width: `${stats.percentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="text-center">
                            <Link to="/exams">
                                <Button variant="outline" className="mr-4">← Quay lại danh sách đề</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Filter and Controls */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Xem đáp án chi tiết</h2>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant={showAllExplanations ? "default" : "outline"}
                            size="sm"
                            onClick={toggleAllExplanations}
                            className="gap-2"
                        >
                            {showAllExplanations ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showAllExplanations ? "Ẩn tất cả giải thích" : "Hiện tất cả giải thích"}
                        </Button>
                        <div className="h-6 w-px bg-gray-300 mx-2" />
                        <Filter size={18} className="text-gray-500" />
                        <Button
                            variant={filter === 'all' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            Tất cả ({stats.total})
                        </Button>
                        <Button
                            variant={filter === 'correct' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('correct')}
                            className={filter === 'correct' ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-300 hover:bg-green-50"}
                        >
                            Đúng ({stats.correct})
                        </Button>
                        <Button
                            variant={filter === 'incorrect' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('incorrect')}
                            className={filter === 'incorrect' ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-50"}
                        >
                            Sai ({stats.incorrect})
                        </Button>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    {filteredQuestions.map(q => (
                        <QuestionResultCard
                            key={q.question_id}
                            question={q}
                            isExpanded={expandedExplanations.has(q.question_id)}
                            onToggleExplanation={() => toggleExplanation(q.question_id)}
                        />
                    ))}
                </div>

                {filteredQuestions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Không có câu hỏi nào phù hợp với bộ lọc đã chọn.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function QuestionResultCard({
    question,
    isExpanded,
    onToggleExplanation
}: {
    question: ExamQuestion;
    isExpanded: boolean;
    onToggleExplanation: () => void;
}) {
    const isCorrect = question.is_correct;
    const isSpeakingOrWriting = question.question_type &&
        ['Read Aloud', 'Describe Picture', 'Response to Questions', 'Express Opinion',
            'Write Sentence from Picture', 'Respond to Email', 'Opinion Essay', 'Write Sentence']
            .some(t => question.question_type?.includes(t));
    const hasOptions = question.options && question.options.length > 0;

    return (
        <Card className={cn(
            "border-l-4 transition-all hover:shadow-md",
            isCorrect ? "border-l-green-500" : (isSpeakingOrWriting ? "border-l-blue-500" : "border-l-red-500")
        )}>
            <CardContent className="pt-6">
                <div className="flex gap-4">
                    {/* Question Number */}
                    <div className="flex-shrink-0">
                        <span className={cn(
                            "font-bold w-10 h-10 flex items-center justify-center rounded-full text-white text-sm",
                            isCorrect ? "bg-green-500" : (isSpeakingOrWriting ? "bg-blue-500" : "bg-red-500")
                        )}>
                            {question.question_number}
                        </span>
                    </div>

                    {/* Question Content */}
                    <div className="flex-grow">
                        {question.question_type && (
                            <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                Part {question.part_number} - {question.question_type}
                            </span>
                        )}
                        <div className="font-medium mb-3 whitespace-pre-wrap text-gray-800">
                            {question.question_text}
                        </div>

                        {/* Media */}
                        {(question.image_urls?.length || question.audio_urls?.length) && (
                            <div className="mb-4 space-y-3">
                                {question.image_urls?.map((url, i) => (
                                    <div key={i} className="rounded-lg overflow-hidden border border-gray-200 inline-block">
                                        <img src={url} alt={`Câu ${question.question_number}`} className="max-w-full h-auto max-h-[250px]" />
                                    </div>
                                ))}
                                {question.audio_urls?.map((url, i) => (
                                    <div key={i}>
                                        <audio controls src={url} className="w-full max-w-md" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Options (Multiple Choice) */}
                        {hasOptions && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {question.options?.map(opt => {
                                    const isSelected = opt === question.user_selected;
                                    const isAnswer = opt === question.correct_answer;

                                    return (
                                        <div
                                            key={opt}
                                            className={cn(
                                                "p-3 rounded-lg border text-sm flex items-center gap-2 transition-all",
                                                isAnswer && "bg-green-100 border-green-400 text-green-800 font-semibold",
                                                isSelected && !isAnswer && "bg-red-100 border-red-400 text-red-800",
                                                !isSelected && !isAnswer && "bg-gray-50 border-gray-200 text-gray-600"
                                            )}
                                        >
                                            {isAnswer && <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />}
                                            {isSelected && !isAnswer && <XCircle size={16} className="text-red-600 flex-shrink-0" />}
                                            <span>{opt}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Text Answer (Speaking/Writing) */}
                        {!hasOptions && (
                            <div className="mb-4">
                                <div className="text-sm font-semibold text-gray-700 mb-1">Câu trả lời của bạn:</div>
                                <div className="p-3 bg-gray-50 border rounded-md whitespace-pre-wrap text-gray-800 font-mono text-sm">
                                    {question.user_selected || <span className="text-gray-400 italic">Không có câu trả lời</span>}
                                </div>
                            </div>
                        )}

                        {/* Answer Summary */}
                        <div className="flex items-center gap-4 mb-3 text-sm">
                            <span className="text-gray-600">
                                <strong>Đáp án đúng:</strong>{" "}
                                <span className="text-green-600 font-bold">{question.correct_answer || "N/A"}</span>
                            </span>
                            {question.user_selected && (
                                <span className="text-gray-600">
                                    <strong>Bạn chọn:</strong>{" "}
                                    <span className={cn(
                                        "font-bold",
                                        isCorrect ? "text-green-600" : "text-red-600"
                                    )}>
                                        {question.user_selected}
                                    </span>
                                </span>
                            )}
                        </div>

                        {/* Explanation Toggle Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleExplanation}
                            className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {isExpanded ? "Ẩn giải thích" : "Xem giải thích"}
                        </Button>

                        {/* Collapsible Explanation */}
                        {isExpanded && (
                            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200 animate-in slide-in-from-top-2 duration-200">
                                <span className="font-bold text-blue-800 block mb-2">
                                    {isSpeakingOrWriting ? "Câu trả lời mẫu / Giải thích:" : "Giải thích:"}
                                </span>
                                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                    {question.explanation || "Chưa có giải thích cho câu hỏi này."}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                        {isCorrect && <CheckCircle2 className="text-green-500 w-7 h-7" />}
                        {!isCorrect && !isSpeakingOrWriting && <XCircle className="text-red-500 w-7 h-7" />}
                        {isSpeakingOrWriting && (
                            <div className="text-blue-500 font-bold text-xs uppercase px-2 py-1 bg-blue-100 rounded">
                                Review
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
