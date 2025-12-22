import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Progress } from '@/shared/components/ui/progress';
import { useWriting } from '../hooks';

type WritingMode = 'exam' | 'custom' | 'generated';

interface WritingPracticeProps {
  mode: WritingMode;
}

export function WritingPractice({ mode: writingMode }: WritingPracticeProps) {
  const {
    mode,
    topics,
    topicType,
    currentTopic,
    essay,
    evaluation,
    isLoading,
    error,
    wordCount,
    loadTopics,
    setTopicType,
    selectTopic,
    generateTopic,
    setEssay,
    submitEssay,
    reset,
    tryAnother,
  } = useWriting();

  useEffect(() => {
    loadTopics();
    setTopicType(writingMode);
  }, [loadTopics, writingMode, setTopicType]);

  const topicCategories = ['Education', 'Technology', 'Environment', 'Health', 'Work', 'Government'];

  // Topic Selection Mode
  if (mode === 'topic-select') {
    return (
      <div className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Exam Topics */}
        {writingMode === 'exam' && (
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="text-sm font-medium">Đề thi TOEIC/IELTS</h3>

              <Button onClick={() => selectTopic()} disabled={isLoading} className="w-full">
                {isLoading ? 'Đang tải...' : 'Lấy đề ngẫu nhiên'}
              </Button>

              {topics && topics.writing_exam_topics.length > 0 && (
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {topics.writing_exam_topics.slice(0, 8).map((topic) => (
                    <button
                    key={topic.id}
                    className="w-full text-left px-4 py-2.5 border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={() => selectTopic(topic.id)}
                    disabled={isLoading}
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Topics by Category */}
        {writingMode === 'custom' && (
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-medium">Chọn chủ đề</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topicCategories.map((cat) => (
                <button
                  key={cat}
                  className="py-2.5 px-4 border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => selectTopic(undefined, cat)}
                  disabled={isLoading}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Generated Topics */}
        {writingMode === 'generated' && (
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium">AI tạo đề mới</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI sẽ tạo đề viết mới dựa trên chủ đề bạn chọn
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topicCategories.map((cat) => (
                <button
                  key={cat}
                  className="py-2.5 px-4 border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => generateTopic(cat)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang tải...' : cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Writing Mode
  if (mode === 'writing') {
    return (
      <div className="space-y-6">
        {/* Topic Display */}
        <div className="border rounded-lg">
          <div className="p-4 border-b flex items-start justify-between gap-4">
            <div>
              <h2 className="font-medium">
                {currentTopic?.test_name || currentTopic?.category || 'Đề viết'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{currentTopic?.question_type}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              Quay lại
            </Button>
          </div>
          <div className="p-4 bg-muted/50">
            <p className="text-sm leading-relaxed">{currentTopic?.context}</p>
          </div>
        </div>

        {/* Writing Area */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Bài viết của bạn</h3>
            <span className="text-sm text-muted-foreground">
              {wordCount} từ {wordCount < 150 && '(tối thiểu 150)'}
            </span>
          </div>

          <Textarea
            placeholder="Viết bài luận của bạn tại đây..."
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={14}
            className="resize-none"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={submitEssay} disabled={wordCount < 50 || isLoading} className="w-full">
            {isLoading ? 'Đang gửi...' : 'Gửi bài đánh giá'}
          </Button>
        </div>
      </div>
    );
  }

  // Evaluating Mode
  if (mode === 'evaluating') {
    return (
      <div className="border rounded-lg p-12 flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Đang đánh giá bài viết của bạn...</p>
          <p className="text-xs text-muted-foreground mt-1">Quá trình này có thể mất 30-60 giây</p>
        </div>
      </div>
    );
  }

  // Result Mode
  if (mode === 'result' && evaluation) {
    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Điểm tổng</span>
            <span className="text-3xl font-semibold">{evaluation.overall_score.toFixed(1)}/10</span>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-medium">Chi tiết điểm số</h3>
          <div className="space-y-3">
            {[
              { label: 'Hoàn thành nhiệm vụ', value: evaluation.task_achievement_score },
              { label: 'Mạch lạc & Liên kết', value: evaluation.coherence_cohesion_score },
              { label: 'Từ vựng', value: evaluation.lexical_resource_score },
              { label: 'Ngữ pháp', value: evaluation.grammar_accuracy_score },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>{item.value.toFixed(1)}</span>
                </div>
                <Progress value={item.value * 10} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="border rounded-lg p-6 space-y-3">
          <h3 className="text-sm font-medium">Nhận xét</h3>
          <p className="text-sm">{evaluation.feedback}</p>
        </div>

        {/* Errors */}
        {evaluation.errors && evaluation.errors.length > 0 && (
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-medium">Lỗi cần sửa</h3>
            <div className="space-y-3">
              {evaluation.errors.filter(e => e.type !== 'strength').slice(0, 10).map((err, i) => (
                <div key={i} className="p-3 bg-muted rounded-md">
                  <span className="text-xs px-2 py-0.5 bg-background border rounded">{err.type}</span>
                  <p className="text-sm mt-2">
                    <span className="line-through text-muted-foreground">{err.text}</span>
                    {err.correction && <span className="ml-2">→ {err.correction}</span>}
                  </p>
                  {err.explanation && (
                    <p className="text-xs text-muted-foreground mt-1">{err.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {evaluation.suggestions && evaluation.suggestions.length > 0 && (
          <div className="border rounded-lg p-6 space-y-3">
            <h3 className="text-sm font-medium">Gợi ý cải thiện</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              {evaluation.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improved Version */}
        {evaluation.improved_version && (
          <div className="border rounded-lg p-6 space-y-3">
            <h3 className="text-sm font-medium">Bài viết mẫu (đã sửa)</h3>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{evaluation.improved_version}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={tryAnother} className="flex-1">
            Làm đề khác
          </Button>
          <Button onClick={reset} className="flex-1">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

