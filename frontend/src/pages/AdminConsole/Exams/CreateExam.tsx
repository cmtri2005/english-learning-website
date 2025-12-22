import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function CreateExam() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'readlis',
        duration_minutes: 120,
        year: new Date().getFullYear()
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Tiêu đề không được để trống');
            return;
        }

        setLoading(true);
        try {
            const res = await api.adminRequest('/api/admin/exams', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (res.success) {
                toast.success('Đã tạo đề thi');
                navigate('/admin/exams');
            } else {
                toast.error(res.message || 'Failed to create exam');
            }
        } catch (error) {
            toast.error('Failed to create exam');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-2xl">
                {/* Header */}
                <div className="mb-6">
                    <Link to="/admin/exams" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                        <ArrowLeft size={14} />
                        Quay lại danh sách
                    </Link>
                    <h2 className="text-2xl font-bold">Tạo đề thi mới</h2>
                    <p className="text-muted-foreground text-sm">Tạo đề thi thủ công (câu hỏi sẽ được thêm sau)</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Tiêu đề *</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="VD: TOEIC Test 2024 - Full Test 01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả ngắn về đề thi..."
                            className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Loại đề thi</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="readlis">Listening & Reading</option>
                                <option value="speaking">Speaking</option>
                                <option value="writting">Writing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Năm</label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Thời gian làm bài (phút)</label>
                        <Input
                            type="number"
                            value={formData.duration_minutes}
                            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo đề thi
                        </Button>
                        <Link to="/admin/exams">
                            <Button type="button" variant="outline">Hủy</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
