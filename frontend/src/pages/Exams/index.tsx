import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { examService, Exam } from "@/services/exam.service";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Clock, BookOpen, Search, ArrowRight, BookMarked } from "lucide-react";
import { AppLayout } from "@/shared/components/layout";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";

export function ExamListPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        examService.getExams().then((response) => {
            if (response.success && response.data) {
                setExams(response.data);
            }
            setLoading(false);
        });
    }, []);

    const filteredExams = exams.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="bg-gradient-to-b from-primary/5 to-transparent pb-10 pt-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                                Practice Exams
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Master your skills with our comprehensive collection of TOEIC tests.
                            </p>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search exams..."
                                className="pl-10 bg-white shadow-sm border-gray-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredExams.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed">
                            <BookMarked className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No exams found</h3>
                            <p className="text-gray-500">Try adjusting your search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExams.map((exam) => (
                                <Card
                                    key={exam.exam_id}
                                    className="flex flex-col border-0 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                TOEIC
                                            </Badge>
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {exam.duration_minutes}m
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                                            {exam.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {exam.description || "No description provided."}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow space-y-4">
                                        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-purple-500" />
                                                <span className="font-medium">{exam.total_questions} Questions</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span>Active</span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-0">
                                        <Link to={`/exams/${exam.exam_id}`} className="w-full">
                                            <Button className="w-full group-hover:bg-primary/90 transition-all font-semibold">
                                                Start Practice
                                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
