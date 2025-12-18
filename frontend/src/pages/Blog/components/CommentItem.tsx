import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Edit2, Trash2, X, Check } from 'lucide-react';
import { useCommentReaction } from '../hooks/useReactions';
import { ReactionButton } from './ReactionButton';
import type { BlogComment } from '@/services/blog';

interface CommentItemProps {
    comment: BlogComment;
    currentUserId?: number;
    isSubmitting: boolean;
    onEdit: (comment: BlogComment) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
    isEditing: boolean;
    editContent: string;
    setEditContent: (content: string) => void;
}

export function CommentItem({
    comment,
    currentUserId,
    isSubmitting,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    isEditing,
    editContent,
    setEditContent,
}: CommentItemProps) {
    const {
        hasReacted,
        count,
        isLoading: reactionLoading,
        toggle: toggleReaction,
    } = useCommentReaction(comment.id, {
        initialHasReacted: comment.has_reacted,
        initialCount: comment.likes_count,
    });

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
        <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                        </span>
                        {comment.old_content && (
                            <span className="text-xs text-muted-foreground">(đã chỉnh sửa)</span>
                        )}
                    </div>

                    {/* Actions for owner */}
                    {currentUserId === comment.user_id && !isEditing && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(comment)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => onDelete(comment.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Edit Mode */}
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={onSaveEdit} disabled={isSubmitting}>
                                <Check className="h-4 w-4 mr-1" />
                                Lưu
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onCancelEdit}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Hủy
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                        {/* Reaction Button */}
                        <div className="pt-1">
                            <ReactionButton
                                hasReacted={hasReacted}
                                count={count}
                                isLoading={reactionLoading}
                                onToggle={toggleReaction}
                                size="sm"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

