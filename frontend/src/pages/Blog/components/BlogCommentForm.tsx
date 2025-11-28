import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { useAddBlogComment } from "@/store/server/blog-queries";

interface BlogCommentFormProps {
  postId: number;
  parentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BlogCommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
}: BlogCommentFormProps) {
  const [content, setContent] = useState("");
  const addComment = useAddBlogComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await addComment.mutateAsync({
        postId,
        data: { content: content.trim(), parent_id: parentId },
      });
      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        className="mb-4 min-h-[100px]"
        disabled={addComment.isPending}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={addComment.isPending || !content.trim()}>
          {addComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

