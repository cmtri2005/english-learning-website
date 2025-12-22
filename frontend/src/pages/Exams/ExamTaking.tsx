import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examService, ExamDetail, ExamQuestionGroup, ExamQuestion } from "@/services/exam.service";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Send, X, Maximize2, Minimize2 } from "lucide-react";
import { Textarea } from "@/shared/components/ui/textarea";
import { AppLayout } from "@/shared/components/layout";

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function ExamTakingPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [activePart, setActivePart] = useState(1);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [parts, setParts] = useState<Record<number, (ExamQuestionGroup | ExamQuestion)[]>>({});

    const isSinglePartExam = examDetail?.type === 'speaking' || examDetail?.type === 'writing';
    const availableParts = Object.keys(parts).map(Number).sort((a, b) => a - b);

    // Calculate progress
    const totalQuestions = Object.values(parts).flat().reduce((acc, item) => {
        if ('questions' in item) return acc + item.questions.length;
        return acc + 1;
    }, 0);
    const answeredCount = Object.keys(answers).length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    useEffect(() => {
        if (id) {
            examService.getExamDetail(parseInt(id)).then((response) => {
                if (response.success && response.data) {
                    const data = response.data;
                    setExamDetail(data);
                    setTimeLeft(data.duration_minutes * 60);

                    const partsMap: Record<number, (ExamQuestionGroup | ExamQuestion)[]> = {};
                    data.groups.forEach(g => {
                        if (!partsMap[g.part_number]) partsMap[g.part_number] = [];
                        partsMap[g.part_number].push(g);
                    });
                    data.standalone_questions.forEach(q => {
                        if (!partsMap[q.part_number]) partsMap[q.part_number] = [];
                        partsMap[q.part_number].push(q);
                    });
                    Object.keys(partsMap).forEach(key => {
                        const k = parseInt(key);
                        partsMap[k].sort((a, b) => {
                            const qA = (a as ExamQuestionGroup).questions ? (a as ExamQuestionGroup).questions[0]?.question_number : (a as ExamQuestion).question_number;
                            const qB = (b as ExamQuestionGroup).questions ? (b as ExamQuestionGroup).questions[0]?.question_number : (b as ExamQuestion).question_number;
                            return (qA || 0) - (qB || 0);
                        });
                    });
                    setParts(partsMap);

                    // Set active part to first available
                    const firstPart = Object.keys(partsMap).map(Number).sort((a, b) => a - b)[0];
                    if (firstPart) setActivePart(firstPart);
                }
                setLoading(false);
            });
        }
    }, [id]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(interval);
                    submitExam();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    const handleSelectAnswer = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const submitExam = async () => {
        if (!id) return;
        if (!window.confirm('Bạn có chắc chắn muốn nộp bài?')) return;
        try {
            const res = await examService.submitExam(parseInt(id), answers);
            if (res.success && res.data) {
                navigate(`/exams/result/${res.data.attempt_id}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Đang tải đề thi...</p>
                </div>
            </div>
        );
    }

    if (!examDetail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-red-600">Không thể tải đề thi</p>
            </div>
        );
    }

    const isTimeWarning = timeLeft < 300; // < 5 minutes

    const Content = (
        <div className="min-h-screen bg-slate-50/50">
            {/* Compact Header */}
            <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
                <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/exams')}
                            className="p-1.5 -ml-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="h-5 w-px bg-slate-200" />
                        <h1 className="text-sm font-medium text-slate-800 truncate max-w-[300px]">
                            {examDetail.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Timer */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono",
                            isTimeWarning
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-700"
                        )}>
                            <Clock size={14} className={isTimeWarning ? "text-red-500" : "text-slate-500"} />
                            {formatTime(timeLeft)}
                        </div>

                        <div className="h-5 w-px bg-slate-200 mx-1" />

                        <button
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className="p-2 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                            title={isFocusMode ? "Thoát chế độ tập trung" : "Chế độ tập trung"}
                        >
                            {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>

                        <Button
                            size="sm"
                            onClick={submitExam}
                            className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                            <Send size={14} />
                            Nộp bài
                        </Button>
                    </div>
                </div>

                {/* Audio bar - only if audio exists */}
                {examDetail?.audio_url && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                        <div className="max-w-screen-2xl mx-auto">
                            <audio
                                controls
                                src={examDetail.audio_url}
                                className="w-full max-w-2xl h-8 mx-auto"
                            />
                        </div>
                    </div>
                )}
            </header>

            <div className="max-w-screen-2xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Part Navigation - subtle pills */}
                        {!isSinglePartExam && availableParts.length > 1 && (
                            <nav className="mb-5 flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200/80 inline-flex">
                                {availableParts.map(p => {
                                    const questionsInPart = parts[p]?.flatMap(item => 'questions' in item ? item.questions : [item]) || [];
                                    const answeredInPart = questionsInPart.filter(q => answers[q.question_id]).length;
                                    const isComplete = answeredInPart === questionsInPart.length && questionsInPart.length > 0;

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setActivePart(p)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all relative",
                                                activePart === p
                                                    ? "bg-slate-800 text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            Part {p}
                                            {isComplete && (
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        )}

                        {/* Questions Container */}
                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                            <div className="p-6 space-y-6">
                                {parts[activePart]?.length > 0 ? (
                                    parts[activePart]?.map((item, idx) => {
                                        const isGroup = 'questions' in item;
                                        if (isGroup) return <GroupRender key={`g-${idx}`} group={item as ExamQuestionGroup} answers={answers} onAnswer={handleSelectAnswer} />;
                                        return <QuestionRender key={`q-${(item as ExamQuestion).question_id}`} question={item as ExamQuestion} answers={answers} onAnswer={handleSelectAnswer} />;
                                    })
                                ) : (
                                    <div className="py-16 text-center text-slate-400">
                                        {isSinglePartExam ? "Chưa có câu hỏi" : `Không có câu hỏi trong Part ${activePart}`}
                                    </div>
                                )}
                            </div>

                            {/* Part navigation footer */}
                            {!isSinglePartExam && availableParts.length > 1 && (
                                <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={activePart <= availableParts[0]}
                                        onClick={() => {
                                            const idx = availableParts.indexOf(activePart);
                                            if (idx > 0) setActivePart(availableParts[idx - 1]);
                                        }}
                                        className="gap-1 text-slate-600"
                                    >
                                        <ChevronLeft size={16} />
                                        Part trước
                                    </Button>
                                    <span className="text-xs text-slate-400">
                                        {activePart} / {availableParts.length}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={activePart >= availableParts[availableParts.length - 1]}
                                        onClick={() => {
                                            const idx = availableParts.indexOf(activePart);
                                            if (idx < availableParts.length - 1) setActivePart(availableParts[idx + 1]);
                                        }}
                                        className="gap-1 text-slate-600"
                                    >
                                        Part sau
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0 hidden lg:block">
                        <div className="sticky top-20 space-y-4">
                            {/* Progress Card */}
                            <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tiến độ</span>
                                    <span className="text-sm font-semibold text-slate-800">{answeredCount}/{totalQuestions}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">{progressPercent}% hoàn thành</p>
                            </div>

                            {/* Question Grid */}
                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 max-h-[60vh] overflow-y-auto">
                                {availableParts.map(partNum => {
                                    const questionsInPart = parts[partNum]?.flatMap(item => 'questions' in item ? item.questions : [item]) || [];
                                    if (questionsInPart.length === 0) return null;

                                    return (
                                        <div key={partNum} className="mb-4 last:mb-0">
                                            {!isSinglePartExam && (
                                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    Part {partNum}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {questionsInPart.map(q => (
                                                    <button
                                                        key={q.question_id}
                                                        onClick={() => setActivePart(partNum)}
                                                        className={cn(
                                                            "w-8 h-8 text-xs font-medium rounded-md transition-all",
                                                            answers[q.question_id]
                                                                ? "bg-emerald-500 text-white"
                                                                : activePart === partNum
                                                                    ? "bg-slate-200 text-slate-700"
                                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                        )}
                                                    >
                                                        {q.question_number}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );

    if (isFocusMode) return Content;
    return <AppLayout>{Content}</AppLayout>;
}

function GroupRender({ group, answers, onAnswer }: { group: ExamQuestionGroup, answers: Record<number, string>, onAnswer: (q: number, v: string) => void }) {
    return (
        <div className="space-y-5">
            {/* Context block */}
            {(group.image_url || group.audio_url || group.content_text) && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    {group.image_url && (
                        <img
                            src={group.image_url}
                            alt=""
                            className="max-w-full max-h-80 mx-auto rounded-md mb-3"
                        />
                    )}
                    {group.audio_url && (
                        <audio controls src={group.audio_url} className="w-full h-9 mb-3" />
                    )}
                    {group.content_text && (
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {group.content_text}
                        </div>
                    )}
                </div>
            )}
            {/* Questions */}
            <div className="space-y-4 pl-1">
                {group.questions.map(q => (
                    <QuestionRender key={q.question_id} question={q} answers={answers} onAnswer={onAnswer} isGrouped partNumber={group.part_number} />
                ))}
            </div>
        </div>
    );
}

function QuestionRender({ question, answers, onAnswer, isGrouped = false, partNumber }: { question: ExamQuestion, answers: Record<number, string>, onAnswer: (q: number, v: string) => void, isGrouped?: boolean, partNumber?: number }) {
    const options = question.options || [];
    const isWriting = question.question_type && ['Write Sentence from Picture', 'Respond to Email', 'Opinion Essay', 'Write Sentence'].some(t => question.question_type?.includes(t));
    const isSpeaking = question.question_type && ['Read Aloud', 'Describe Picture', 'Response to Questions', 'Express Opinion'].some(t => question.question_type?.includes(t));
    const isInput = (isWriting || isSpeaking) || (options.length === 0 && question.question_type);
    const shouldShowImages = !(isGrouped && partNumber === 7);
    const isAnswered = !!answers[question.question_id];

    return (
        <div className={cn(
            "group",
            !isGrouped && "p-4 rounded-lg border transition-colors",
            !isGrouped && isAnswered ? "border-emerald-200 bg-emerald-50/30" : !isGrouped && "border-slate-100 bg-slate-50/30 hover:border-slate-200"
        )}>
            <div className="flex gap-3 mb-3">
                <span className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center",
                    isAnswered ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                )}>
                    {question.question_number}
                </span>
                <div className="flex-1 pt-0.5">
                    {question.question_type && (
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                            {question.question_type}
                        </span>
                    )}
                    {question.question_text && (
                        <p className="text-sm text-slate-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                            {question.question_text}
                        </p>
                    )}
                </div>
            </div>

            {/* Media */}
            {shouldShowImages && question.image_urls?.length > 0 && (
                <div className="ml-10 mb-3 space-y-2">
                    {question.image_urls.map((url, i) => (
                        <img key={i} src={url} alt="" className="max-w-full max-h-60 rounded-md border border-slate-200" />
                    ))}
                </div>
            )}
            {question.audio_urls?.length > 0 && (
                <div className="ml-10 mb-3">
                    {question.audio_urls.map((url, i) => (
                        <audio key={i} controls src={url} className="w-full h-9" />
                    ))}
                </div>
            )}

            {/* Options */}
            <div className="ml-10 space-y-1.5">
                {options.length > 0 && options.map((opt) => (
                    <label
                        key={opt}
                        className={cn(
                            "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-all text-sm",
                            answers[question.question_id] === opt
                                ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            answers[question.question_id] === opt
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-slate-300"
                        )}>
                            {answers[question.question_id] === opt && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                        </div>
                        <input
                            type="radio"
                            name={`q-${question.question_id}`}
                            value={opt}
                            checked={answers[question.question_id] === opt}
                            onChange={() => onAnswer(question.question_id, opt)}
                            className="sr-only"
                        />
                        <span>{opt}</span>
                    </label>
                ))}

                {isInput && (
                    <Textarea
                        placeholder={isSpeaking ? "Ghi chú câu trả lời..." : "Nhập câu trả lời..."}
                        value={answers[question.question_id] || ''}
                        onChange={(e) => onAnswer(question.question_id, e.target.value)}
                        className="min-h-[120px] text-sm bg-white border-slate-200 focus:border-slate-400"
                    />
                )}
            </div>
        </div>
    );
}
