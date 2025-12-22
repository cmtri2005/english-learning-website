import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Progress } from '@/shared/components/ui/progress';
import { useSpeaking } from '../hooks';
import { PronunciationPractice } from './PronunciationPractice';

type SpeakingMode = 'pronunciation' | 'topic';

interface SpeakingPracticeProps {
  mode: SpeakingMode;
}

export function SpeakingPractice({ mode: speakingMode }: SpeakingPracticeProps) {
  const {
    mode,
    topics,
    currentTopic,
    transcript,
    evaluation,
    isLoading,
    isRecording,
    error,
    recordingTime,
    loadTopics,
    selectTopic,
    startRecording,
    stopRecording,
    setTranscript,
    submitTranscript,
    reset,
    tryAnother,
  } = useSpeaking();

  useEffect(() => {
    if (speakingMode === 'topic') {
      loadTopics();
    }
  }, [speakingMode, loadTopics]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Pronunciation Mode */}
      {speakingMode === 'pronunciation' && <PronunciationPractice />}

      {/* Topic Mode */}
      {speakingMode === 'topic' && (
          <>
            {/* Topic Selection */}
            {mode === 'topic-select' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 space-y-4">
                <div>
                  <h2 className="font-medium">Chọn đề luyện nói</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chọn từ danh sách hoặc lấy đề ngẫu nhiên
                  </p>
                </div>

                <Button
                  onClick={() => selectTopic()}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Đang tải...' : 'Lấy đề ngẫu nhiên'}
                </Button>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {topics && topics.speaking_topics.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-sm text-muted-foreground">Hoặc chọn đề cụ thể:</p>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {topics.speaking_topics.slice(0, 10).map((topic) => (
                        <button
                          key={topic.id}
                          className="w-full text-left px-4 py-3 border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() => selectTopic(topic.id)}
                          disabled={isLoading}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Practicing Mode */}
          {(mode === 'practicing' || mode === 'recording') && (
            <div className="space-y-6">
              {/* Topic Display */}
              <div className="border rounded-lg">
                <div className="p-4 border-b flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium">{currentTopic?.test_name}</h2>
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

              {/* Recording Section */}
              <div className="border rounded-lg p-6 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  {isRecording && (
                    <div className="text-center">
                      <div className="text-3xl font-mono font-semibold tabular-nums">
                        {formatTime(recordingTime)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Đang ghi âm...</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!isRecording ? (
                      <Button onClick={startRecording} size="lg">
                        Bắt đầu ghi âm
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={stopRecording} size="lg">
                        Dừng ghi âm
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground">hoặc nhập văn bản</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Nhập câu trả lời của bạn..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={4}
                    disabled={isRecording}
                    className="resize-none"
                  />
                  <Button
                    onClick={submitTranscript}
                    disabled={!transcript.trim() || isLoading || isRecording}
                    className="w-full"
                  >
                    {isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
          )}

          {/* Evaluating Mode */}
          {mode === 'evaluating' && (
            <div className="border rounded-lg p-12 flex flex-col items-center gap-4">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Đang đánh giá bài nói của bạn...</p>
            </div>
          )}

          {/* Result Mode */}
          {mode === 'result' && evaluation && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Điểm tổng</span>
                  <span className="text-3xl font-semibold">
                    {evaluation.scores?.overall.toFixed(1)}/10
                  </span>
                </div>

                {evaluation.feedback?.is_off_topic && (
                  <p className="text-sm mt-4 p-3 bg-muted rounded-md">
                    {evaluation.feedback.off_topic_warning}
                  </p>
                )}
              </div>

              {/* Detailed Scores */}
              <div className="border rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-medium">Chi tiết điểm số</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Phát âm', value: evaluation.scores?.pronunciation || 0 },
                    { label: 'Độ trôi chảy', value: evaluation.scores?.fluency || 0 },
                    { label: 'Ngữ pháp', value: evaluation.scores?.grammar || 0 },
                    { label: 'Từ vựng', value: evaluation.scores?.vocabulary || 0 },
                    { label: 'Nội dung', value: evaluation.scores?.content || 0 },
                    { label: 'Đúng chủ đề', value: evaluation.scores?.topic_matching || 0 },
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

              {/* Transcript */}
              <div className="border rounded-lg p-6 space-y-3">
                <h3 className="text-sm font-medium">Nội dung bạn nói</h3>
                <p className="text-sm p-3 bg-muted rounded-md">{evaluation.transcript}</p>
              </div>

              {/* Feedback */}
              {evaluation.feedback && (
                <div className="border rounded-lg p-6 space-y-4">
                  <h3 className="text-sm font-medium">Nhận xét chi tiết</h3>

                  {evaluation.feedback.summary && (
                    <p className="text-sm">{evaluation.feedback.summary}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {evaluation.feedback.strengths && evaluation.feedback.strengths.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Điểm mạnh</h4>
                        <ul className="text-sm space-y-1">
                          {evaluation.feedback.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.feedback.improvements && evaluation.feedback.improvements.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Cần cải thiện</h4>
                        <ul className="text-sm space-y-1">
                          {evaluation.feedback.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {evaluation.feedback.vietnamese_tips && evaluation.feedback.vietnamese_tips.length > 0 && (
                    <div className="p-4 bg-muted rounded-md space-y-2">
                      <h4 className="text-sm font-medium">Mẹo cho người Việt</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {evaluation.feedback.vietnamese_tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
          )}
          </>
        )}
    </div>
  );
}
