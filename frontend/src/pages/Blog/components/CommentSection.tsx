import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { MessageCircle, Send, Loader2, Edit2, Trash2, X, Check } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { useAuth } from '@/shared/hooks/useAuth';
import { CommentItem } from './CommentItem';
import type { BlogComment } from '@/services/blog';

interface CommentSectionProps {
    blogId: number;
}

export function CommentSection({ blogId }: CommentSectionProps) {
    const { user, isAuthenticated } = useAuth();
    const {
        comments,
        pagination,
        isLoading,
        isSubmitting,
        error,
        addComment,
        updateComment,
        deleteComment,
        loadMore,
    } = useComments(blogId);

    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const success = await addComment(newComment.trim());
        if (success) {
            setNewComment('');
        }
    };

    const handleEdit = (comment: BlogComment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editContent.trim()) return;

        const success = await updateComment(editingId, editContent.trim());
        if (success) {
            setEditingId(null);
            setEditContent('');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
            await deleteComment(id);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Bình luận ({pagination?.total || 0})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Comment Form */}
                {isAuthenticated ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback>{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <Textarea
                                    placeholder="Viết bình luận của bạn..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    disabled={isSubmitting}
                                    rows={3}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Gửi
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        <p>Vui lòng <a href="/login" className="text-primary hover:underline">đăng nhập</a> để bình luận</p>
                    </div>
                )}

                {/* Comments List */}
                {isLoading && comments.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={user?.id}
                                isSubmitting={isSubmitting}
                                onEdit={handleEdit}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={() => {
                                    setEditingId(null);
                                    setEditContent('');
                                }}
                                onDelete={handleDelete}
                                isEditing={editingId === comment.id}
                                editContent={editContent}
                                setEditContent={setEditContent}
                            />
                        ))}

                        {/* Load More */}
                        {pagination && pagination.current_page < pagination.last_page && (
                            <div className="text-center pt-4">
                                <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Xem thêm bình luận
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
