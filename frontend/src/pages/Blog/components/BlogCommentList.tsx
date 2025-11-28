import { useState } from "react";
import { MessageCircle, Reply } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { BlogComment } from "@/services/blog/blog-api";
import { formatDistanceToNow } from "date-fns";
import BlogCommentForm from "./BlogCommentForm";

interface BlogCommentListProps {
  comments: BlogComment[];
  postId: number;
}

export default function BlogCommentList({ comments, postId }: BlogCommentListProps) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="mx-auto mb-2 opacity-50" size={48} />
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const repliesMap = comments
    .filter((c) => c.parent_id)
    .reduce((acc, reply) => {
      if (!acc[reply.parent_id!]) acc[reply.parent_id!] = [];
      acc[reply.parent_id!].push(reply);
      return acc;
    }, {} as Record<number, BlogComment[]>);

  return (
    <div className="space-y-6">
      {topLevelComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={repliesMap[comment.id] || []}
          postId={postId}
          onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          isReplying={replyingTo === comment.id}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  postId,
  onReply,
  isReplying,
}: {
  comment: BlogComment;
  replies: BlogComment[];
  postId: number;
  onReply: () => void;
  isReplying: boolean;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
          {comment.author_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{comment.author_name}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
          {postId && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onReply}
            >
              <Reply size={14} />
              Reply
            </Button>
          )}
          {isReplying && postId && (
            <div className="mt-4 ml-4">
              <BlogCommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={() => onReply()}
                onCancel={() => onReply()}
              />
            </div>
          )}
          {replies.length > 0 && (
            <div className="mt-4 ml-4 space-y-4 border-l-2 pl-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  postId={postId}
                  onReply={() => {}}
                  isReplying={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

