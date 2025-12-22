import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examService, ExamDetail, ExamQuestionGroup, ExamQuestion } from "@/services/exam.service";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { LogOut, Settings, Volume2, Info, Maximize2, Minimize2 } from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { AppLayout } from "@/shared/components/layout";

// Helper to format time
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

    // State
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // question_id -> option
    const [activePart, setActivePart] = useState(1);
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Processed Data
    const [parts, setParts] = useState<Record<number, (ExamQuestionGroup | ExamQuestion)[]>>({});

    useEffect(() => {
        if (id) {
            examService.getExamDetail(parseInt(id)).then((response) => {
                if (response.success && response.data) {
                    const data = response.data;
                    setExamDetail(data);
                    setTimeLeft(data.duration_minutes * 60);

                    // Organize data into parts
                    const partsMap: Record<number, (ExamQuestionGroup | ExamQuestion)[]> = {};

                    // Add Groups
                    data.groups.forEach(g => {
                        if (!partsMap[g.part_number]) partsMap[g.part_number] = [];
                        partsMap[g.part_number].push(g);
                    });

                    // Add Standalone Questions
                    data.standalone_questions.forEach(q => {
                        if (!partsMap[q.part_number]) partsMap[q.part_number] = [];
                        partsMap[q.part_number].push(q);
                    });

                    // Sort each part by question number
                    Object.keys(partsMap).forEach(key => {
                        const k = parseInt(key);
                        partsMap[k].sort((a, b) => {
                            const qA = (a as ExamQuestionGroup).questions ? (a as ExamQuestionGroup).questions[0]?.question_number : (a as ExamQuestion).question_number;
                            const qB = (b as ExamQuestionGroup).questions ? (b as ExamQuestionGroup).questions[0]?.question_number : (b as ExamQuestion).question_number;
                            return (qA || 0) - (qB || 0);
                        });
                    });

                    setParts(partsMap);
                }
                setLoading(false);
            });
        }
    }, [id]);

    // Timer
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
            } else {
                alert('Submission failed');
            }
        } catch (e) {
            console.error(e);
            alert('Error submitting');
        }
    };

    if (loading) return <div className="p-8 flex justify-center text-lg">Đang tải đề thi...</div>;
    if (!examDetail) return <div className="p-8 text-red-500">Không thể tải đề thi</div>;

    const Content = (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 1. Header Row */}
            <header className={cn(
                "bg-white border-b px-6 py-3 flex justify-between items-center sticky z-40 shadow-sm h-16 transition-all",
                isFocusMode ? "top-0" : "top-0" // Using sticky, so inside AppLayout it will just stick below AppLayout header? AppLayout header is fixed/sticky.
            )}>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">{examDetail.title}</h1>
                    <Button variant="outline" size="sm" onClick={() => navigate('/exams')}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Thoát
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className="text-gray-600 gap-2"
                    >
                        {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        {isFocusMode ? "Exit Focus" : "Focus Mode"}
                    </Button>
                </div>
            </header>

            {/* 2. Audio & Settings Bar (Sub-header) */}
            <div className={cn(
                "bg-white border-b px-6 py-2 flex items-center justify-between sticky z-30 shadow-sm h-14 transition-all",
                isFocusMode ? "top-16" : "top-16"
            )}>
                <div className="flex items-center gap-3">
                    <Switch id="highlight-mode" />
                    <Label htmlFor="highlight-mode" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1">
                        Highlight nội dung <Info size={14} className="text-gray-400" />
                    </Label>
                </div>

                {/* Audio Player */}
                <div className="flex-1 mx-8 flex items-center justify-center">
                    {examDetail?.audio_url ? (
                        <audio controls src={examDetail.audio_url} className="w-full max-w-2xl h-10" />
                    ) : (
                        <span className="text-gray-400 text-sm italic">No audio available for this exam</span>
                    )}
                </div>

                <Button variant="ghost" size="icon">
                    <Settings size={20} className="text-gray-600" />
                </Button>
            </div>

            <main className="flex-grow container mx-auto pt-6 flex gap-6 px-4">
                {/* 3. Left Content (Questions) */}
                <div className="flex-grow w-3/4 pb-20">
                    {/* Part Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7].map(p => (
                            <button
                                key={p}
                                onClick={() => setActivePart(p)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                                    activePart === p
                                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1"
                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                )}
                            >
                                Part {p}
                            </button>
                        ))}
                    </div>

                    {/* Active Part Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] p-6">

                        <div className="space-y-8">
                            {parts[activePart]?.length > 0 ? (
                                parts[activePart]?.map((item, idx) => {
                                    const isGroup = 'questions' in item;
                                    if (isGroup) return <GroupRender key={`g-${idx}`} group={item as ExamQuestionGroup} answers={answers} onAnswer={handleSelectAnswer} />;
                                    return <QuestionRender key={`q-${(item as ExamQuestion).question_id}`} question={item as ExamQuestion} answers={answers} onAnswer={handleSelectAnswer} />;
                                })
                            ) : (
                                <div className="text-center py-20 text-gray-500 italic">No questions available in Part {activePart}.</div>
                            )}
                        </div>

                        <div className="mt-12 flex justify-between pt-6 border-t">
                            <Button variant="outline" disabled={activePart <= 1} onClick={() => setActivePart(p => p - 1)}>
                                ← Previous Part
                            </Button>
                            <Button variant="default" disabled={activePart >= 7} onClick={() => setActivePart(p => p + 1)}>
                                Next Part →
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 4. Right Sidebar (Sticky) */}
                <div className="w-1/4 min-w-[300px] hidden lg:block">
                    <div className={cn("space-y-4 sticky transition-all", isFocusMode ? "top-36" : "top-36")}>
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-5">
                                <div className="mb-2 text-sm text-gray-600 font-medium">Thời gian còn lại:</div>
                                <div className="text-3xl font-bold text-gray-900 mb-6 font-mono tracking-tight">
                                    {formatTime(timeLeft)}
                                </div>

                                <Button
                                    className="w-full text-lg font-bold h-12 bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                                    onClick={submitExam}
                                >
                                    NỘP BÀI
                                </Button>

                                <div className="mt-4 text-center">
                                    <button className="text-sm text-red-500 font-medium hover:underline">
                                        Khôi phục/lưu bài làm ›
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Navigation Grid */}
                        <Card className="border-0 shadow-md max-h-[calc(100vh-400px)] overflow-y-auto">
                            <CardContent className="p-4 space-y-6">
                                {[1, 2, 3, 4, 5, 6, 7].map(partNum => {
                                    const questionsInPart = parts[partNum]?.flatMap(item => 'questions' in item ? item.questions : [item]) || [];
                                    if (questionsInPart.length === 0) return null;

                                    return (
                                        <div key={partNum}>
                                            <div className="font-bold text-sm text-gray-800 mb-2">Part {partNum}</div>
                                            <div className="grid grid-cols-5 gap-2">
                                                {questionsInPart.map(q => (
                                                    <button
                                                        key={q.question_id}
                                                        onClick={() => {
                                                            setActivePart(partNum);
                                                            // Scroll to question after state updates
                                                            setTimeout(() => {
                                                                const el = document.getElementById(`question-${q.question_id}`);
                                                                if (el) {
                                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }
                                                            }, 100);
                                                        }}
                                                        className={cn(
                                                            "w-9 h-9 text-xs font-semibold rounded border flex items-center justify-center transition-all",
                                                            answers[q.question_id]
                                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                                        )}
                                                    >
                                                        {q.question_number}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );

    if (isFocusMode) {
        return Content;
    }

    return (
        <AppLayout>
            {Content}
        </AppLayout>
    );
}

function GroupRender({ group, answers, onAnswer }: { group: ExamQuestionGroup, answers: Record<number, string>, onAnswer: (q: number, v: string) => void }) {
    return (
        <div className="mb-8">
            {/* Group-level context (for Part 3, 4, 6, 7) */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100">
                {group.image_url && (
                    <div className="mb-4 bg-black/5 rounded-lg overflow-hidden flex justify-center">
                        <img src={group.image_url} alt="Question Context" className="max-w-full max-h-[400px] object-contain" />
                    </div>
                )}
                {group.audio_url && (
                    <div className="mb-4">
                        <audio controls src={group.audio_url} className="w-full h-10" />
                    </div>
                )}
                {/* Display content_text (dialogue for Part 3-4, passage for Part 6-7) */}
                {/* Transcript is NEVER shown during exam - only in results */}
                {group.content_text && (
                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line mb-4 border-l-4 border-blue-400 pl-4 py-1">
                        {group.content_text}
                    </div>
                )}
            </div>

            {/* Individual questions within the group */}
            <div className="space-y-6 pl-2">
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

    // Fallback for types not strictly matching strings but having no options (likely writing/speaking)
    const isInput = (isWriting || isSpeaking) || (options.length === 0 && question.question_type);

    // For Part 7 grouped questions, skip individual images since they're shown at group level
    const shouldShowImages = !(isGrouped && partNumber === 7);

    return (
        <div id={`question-${question.question_id}`} className={cn("mb-6", !isGrouped && "p-5 border rounded-xl bg-gray-50/50")}>
            <div className="flex gap-4 mb-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-sm">
                    {question.question_number}
                </div>
                {/* Display question_text (context) for all parts */}
                {/* For Part 1-2: Direct question or instruction */}
                {/* For Part 3-4: Individual question text (e.g., "What does the man suggest?") */}
                {/* For Part 5: The sentence with blank (e.g., "The manager _____ the report.") */}
                {/* For Part 6-7: Individual question text */}
                {/* Transcript is NEVER shown during exam - only in results */}
                {question.question_text && (
                    <div className="flex-grow pt-1 text-gray-800 font-medium text-base">
                        {question.question_type && (
                            <span className="font-bold text-gray-500 text-xs uppercase block mb-1">{question.question_type}</span>
                        )}
                        <div className="whitespace-pre-wrap">{question.question_text}</div>
                    </div>
                )}
            </div>
            {/* Media for Question Level (images/audio for individual questions) */}
            <div className="ml-12 mb-4 space-y-3">
                {shouldShowImages && question.image_urls && question.image_urls.map((url, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt={`Question ${question.question_number} Image ${i + 1}`} className="max-w-full h-auto max-h-[300px]" />
                    </div>
                ))}
                {question.audio_urls && question.audio_urls.map((url, i) => (
                    <div key={i}>
                        <audio controls src={url} className="w-full" />
                    </div>
                ))}
            </div>

            <div className="ml-12 space-y-3">
                {/* Multiple Choice */}
                {options.length > 0 && options.map((opt) => (
                    <label
                        key={opt}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50",
                            answers[question.question_id] === opt
                                ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                                : "border-gray-200"
                        )}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0",
                            answers[question.question_id] === opt
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-400"
                        )}>
                            {answers[question.question_id] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <input
                            type="radio"
                            name={`q-${question.question_id}`}
                            value={opt}
                            checked={answers[question.question_id] === opt}
                            onChange={() => onAnswer(question.question_id, opt)}
                            className="hidden"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                    </label>
                ))}

                {/* Text Input for Writing/Speaking Notes */}
                {isInput && (
                    <div>
                        <Textarea
                            placeholder={isSpeaking ? "Ghi chú câu trả lời của bạn..." : "Nhập câu trả lời của bạn..."}
                            value={answers[question.question_id] || ''}
                            onChange={(e) => onAnswer(question.question_id, e.target.value)}
                            className="min-h-[150px] font-mono text-base bg-white"
                        />
                        {isSpeaking && <p className="text-xs text-gray-500 mt-2 italic">* Đối với bài thi Speaking, vui lòng ghi chú dàn ý hoặc tự ghi âm (hệ thống hiện tại hỗ trợ ghi chú).</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
