import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";

interface Exam {
    exam_id: number;
    title: string;
    description: string;
    type: string;
    duration_minutes: number;
    total_questions: number;
    year: number;
    created_at: string;
}

interface Pagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export default function AdminExamList() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchExams();
    }, [page, typeFilter]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            if (search) params.set('search', search);
            if (typeFilter) params.set('type', typeFilter);

            const res = await api.adminRequest<{ exams: Exam[]; pagination: Pagination }>(
                `/api/admin/exams?${params.toString()}`
            );
            if (res.success && res.data) {
                setExams(res.data.exams);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchExams();
    };

    const handleDelete = async (examId: number, title: string) => {
        if (!confirm(`Xác nhận xóa đề thi "${title}"?`)) return;

        try {
            const res = await api.adminRequest(`/api/admin/exams/${examId}`, {
                method: 'DELETE'
            });
            if (res.success) {
                toast.success('Đã xóa đề thi');
                fetchExams();
            } else {
                toast.error(res.message || 'Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete exam');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'readlis': return 'Listening & Reading';
            case 'speaking': return 'Speaking';
            case 'writting': return 'Writing';
            default: return type;
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'readlis': return 'bg-blue-100 text-blue-700';
            case 'speaking': return 'bg-green-100 text-green-700';
            case 'writting': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Exam Management</h2>
                        <p className="text-muted-foreground text-sm">Quản lý đề thi TOEIC</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/admin/exams/import">
                            <Button variant="outline">Import JSON</Button>
                        </Link>
                        <Link to="/admin/exams/create">
                            <Button className="gap-2">
                                <Plus size={16} />
                                Tạo đề mới
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Tìm theo tiêu đề..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="">Tất cả loại</option>
                        <option value="readlis">Listening & Reading</option>
                        <option value="speaking">Speaking</option>
                        <option value="writting">Writing</option>
                    </select>
                    <Button variant="outline" onClick={handleSearch}>Tìm</Button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium">ID</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium">Tiêu đề</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium">Loại</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium">Số câu</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium">Năm</th>
                                        <th className="text-right px-4 py-3 text-sm font-medium">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                Không có đề thi nào
                                            </td>
                                        </tr>
                                    ) : exams.map((exam) => (
                                        <tr key={exam.exam_id} className="border-t hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">{exam.exam_id}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-sm">{exam.title}</p>
                                                {exam.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                        {exam.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded ${getTypeBadgeClass(exam.type)}`}>
                                                    {getTypeLabel(exam.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{exam.total_questions}</td>
                                            <td className="px-4 py-3 text-sm">{exam.year}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(exam.exam_id, exam.title)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Hiển thị {exams.length} / {pagination.total} đề thi
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Trước
                                    </Button>
                                    <span className="px-3 py-1 text-sm">
                                        Trang {page} / {pagination.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === pagination.last_page}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
