import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { examService, ExamDetail } from "@/services/exam.service";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Clock, BookOpen, AlertCircle } from "lucide-react";

import { AppLayout } from "@/shared/components/layout";

export function ExamDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            examService.getExamDetail(parseInt(id)).then((response) => {
                if (response.success && response.data) {
                    setExamDetail(response.data);
                }
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <AppLayout><div className="p-8 text-center">Loading details...</div></AppLayout>;
    if (!examDetail) return <AppLayout><div className="p-8 text-center">Exam not found</div></AppLayout>;

    return (
        <AppLayout>
            <div className="container mx-auto py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{examDetail.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-600">{examDetail.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                            <Clock className="w-6 h-6 mr-3 text-blue-600" />
                            <div>
                                <div className="font-semibold">{examDetail.duration_minutes} Minutes</div>
                                <div className="text-sm text-gray-500">Duration</div>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-green-50 rounded-lg">
                            <BookOpen className="w-6 h-6 mr-3 text-green-600" />
                            <div>
                                <div className="font-semibold">{examDetail.total_questions} Questions</div>
                                <div className="text-sm text-gray-500">Total Questions</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg flex items-start">
                        <AlertCircle className="w-6 h-6 mr-3 text-yellow-600 flex-shrink-0 mt-1" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Instructions:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Make sure you have a stable internet connection.</li>
                                <li>The timer will start immediately when you click "Start Exam".</li>
                                <li>You cannot pause the exam once started.</li>
                                <li>Audio will be played automatically for listening parts.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Link to={`/exams/${id}/take`}>
                            <Button className="w-full h-12 text-lg">Start Exam</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
        </AppLayout>
    );
}
