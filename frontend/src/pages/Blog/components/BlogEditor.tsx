import { useParams } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { ArrowLeft, Save, Eye, Loader2, X, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBlogEditor } from '../hooks/useBlogEditor';
import { useBlogFilters } from '../hooks/useFilters';
import { useAuth } from '@/shared/hooks/useAuth';
import { MarkdownEditor } from './MarkdownEditor';
import { useState, useMemo } from 'react';

export function BlogEditor() {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useAuth();
    const { categories, tags: allTags } = useBlogFilters();

    const {
        title,
        setTitle,
        content,
        setContent,
        excerpt,
        setExcerpt,
        categoryId,
        setCategoryId,
        selectedTags,
        toggleTag,
        isEditing,
        isLoading,
        isFetching,
        error,
        handleSubmit,
    } = useBlogEditor({ blogId: id, isAuthenticated });

    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [inlineImages, setInlineImages] = useState<File[]>([]);

    const enhancedHandleSubmit = handleSubmit as (
        status: 'draft' | 'published',
        options?: { featuredImage?: File | null; inlineImages?: File[] }
    ) => Promise<void>;

    const submitWithImages = (status: 'draft' | 'published') =>
        enhancedHandleSubmit(status, {
            featuredImage,
            inlineImages,
        });

    // Display names (simplified, hiding blog ID)
    const inlineDisplayNames = useMemo(() => {
        return inlineImages.map((_, idx) => `bl_${idx + 1}.png`);
    }, [inlineImages]);

    if (isFetching) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8 max-w-6xl bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại Blog
                        </Link>
                        <h1 className="text-3xl font-bold">
                            {isEditing ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
                        </h1>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Form - Takes 3 columns */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Tiêu đề *</Label>
                            <Input
                                id="title"
                                placeholder="Nhập tiêu đề bài viết..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                disabled={isLoading}
                                className="text-lg"
                            />
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Mô tả ngắn</Label>
                            <Textarea
                                id="excerpt"
                                placeholder="Mô tả ngắn về bài viết (sẽ tự động tạo nếu để trống)..."
                                value={excerpt}
                                onChange={e => setExcerpt(e.target.value)}
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>

                        {/* Images Card - Two Sections */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Hình ảnh</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Section 1: Featured Image */}
                                <div className="space-y-3 p-4 rounded-lg border border-border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Label className="font-semibold text-base">Ảnh đại diện</Label>
                                        <Badge variant="secondary" className="text-xs">1 file</Badge>
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
                                        disabled={isLoading}
                                        className="cursor-pointer"
                                    />
                                    {featuredImage && (
                                        <div className="text-xs bg-muted/50 p-3 rounded border border-border">
                                            <p className="font-medium mb-1">File đã chọn</p>
                                            <p className="text-muted-foreground">
                                                <span className="font-medium text-foreground">{featuredImage.name}</span> → <code className="bg-background px-1.5 py-0.5 rounded">bl.png</code>
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground italic">
                                        Ảnh này sẽ hiển thị làm thumbnail trong danh sách blog
                                    </p>
                                </div>

                                {/* Section 2: Inline Images */}
                                <div className="space-y-3 p-4 rounded-lg border border-border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Label className="font-semibold text-base">Ảnh nội dung (Markdown)</Label>
                                        <Badge variant="secondary" className="text-xs">Nhiều file</Badge>
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setInlineImages(Array.from(e.target.files || []))}
                                        disabled={isLoading}
                                        className="cursor-pointer"
                                    />
                                    {inlineImages.length > 0 && (
                                        <div className="text-xs space-y-3 bg-muted/50 p-3 rounded border border-border">
                                            <div>
                                                <p className="font-medium mb-2">
                                                    Đã chọn {inlineImages.length} file (thứ tự = số thứ tự trong tên)
                                                </p>
                                                <ul className="list-none space-y-1.5 pl-1">
                                                    {inlineDisplayNames.map((name, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="text-muted-foreground mt-0.5 font-bold">→</span>
                                                            <span className="flex-1 text-muted-foreground">
                                                                <span className="text-foreground font-medium">{inlineImages[idx]?.name}</span>
                                                                {' → '}
                                                                <code className="bg-background px-1.5 py-0.5 rounded">{name}</code>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="pt-3 border-t border-border">
                                                <p className="font-medium mb-1.5 text-foreground">Cách sử dụng trong Markdown:</p>
                                                <code className="block bg-background border border-border px-2 py-1.5 rounded text-xs">
                                                    {'![Mô tả ảnh](' + (inlineDisplayNames[0] || 'bl_1.png') + ')'}
                                                </code>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground italic">
                                        Các ảnh này dùng trong nội dung bài viết. Chọn theo đúng thứ tự muốn dùng
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content - Markdown Editor */}
                        <div className="space-y-2">
                            <Label>Nội dung bài viết (Markdown)</Label>
                            <MarkdownEditor
                                value={content}
                                onChange={setContent}
                                disabled={isLoading}
                                blogId={id ? parseInt(id) : undefined}
                                minHeight="500px"
                            />
                        </div>
                    </div>

                    {/* Sidebar - Takes 1 column */}
                    <div className="space-y-6">
                        {/* Publish Card */}
                        <Card>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base font-semibold">Xuất bản</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        className="w-full flex items-center justify-center gap-2"
                                        variant="outline"
                                        onClick={() => submitWithImages('draft')}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <span>Lưu nháp</span>
                                    </Button>
                                    <Button
                                        className="w-full flex items-center justify-center gap-2"
                                        onClick={() => submitWithImages('published')}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Eye className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <span>Xuất bản</span>
                                    </Button>
                                </div>

                                {/* Info about content storage */}
                                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <p>
                                        Nội dung được lưu dưới dạng Markdown.
                                        Ảnh có thể được thêm với cú pháp: <code className="bg-background px-1 rounded">![alt](bl_1.png)</code>
                                        . Khi tải lên, file sẽ được đổi tên theo dạng <code className="bg-background px-1 rounded">bl.png</code> (ảnh đại diện) và <code className="bg-background px-1 rounded">bl_n.png</code> (ảnh nội dung).
                                    </p>
                                </div>

                                {/* Info about pending approval */}
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <p>
                                        <strong>Lưu ý:</strong> Khi nhấn "Xuất bản", bài viết sẽ được gửi để <strong>duyệt bởi Admin</strong> trước khi được công khai. Bạn có thể theo dõi trạng thái tại trang "Blog của tôi".
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category */}
                        <Card>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base font-semibold">Danh mục</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn danh mục" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base font-semibold">Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <Badge
                                            key={tag.id}
                                            variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            #{tag.name}
                                            {selectedTags.includes(tag.id) && (
                                                <X className="h-3 w-3 ml-1" />
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
