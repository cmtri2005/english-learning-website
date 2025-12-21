import { useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/shared/components/layout";
import { Upload, FileJson } from "lucide-react";

export function AdminImportExamPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Please select a JSON file first.");
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const json = JSON.parse(text);

                // Call API
                // Using generic request since admin service might not verify types strictly yet
                const res = await api.examRequest<{ exam_id: number }>('/api/admin/exams/import', {
                    method: 'POST',
                    body: JSON.stringify(json)
                });

                if (res.success) {
                    toast.success("Exam imported successfully!");
                    navigate('/exams'); // Redirect to exam list
                } else {
                    toast.error(res.message || "Import failed");
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to parse JSON or import failed.");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-xl shadow-lg border-0 bg-white/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Upload size={24} />
                    </div>
                    <CardTitle className="text-2xl font-bold">Import Exam Data</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Upload a JSON file to create a new exam. Supports standard and Study4 formats.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid w-full items-center gap-4">
                        <Label
                            htmlFor="file-upload"
                            className={`
                                flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors
                                ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                            `}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <FileJson className="w-10 h-10 mb-3 text-primary" />
                                        <p className="mb-1 text-sm text-gray-700 font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-400">JSON files only</p>
                                    </>
                                )}
                            </div>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </Label>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleImport}
                            disabled={!file || uploading}
                            className="w-full h-11 text-base font-medium shadow-md transition-all hover:scale-[1.01]"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                "Import Exam"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => navigate('/admin/exams')}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
