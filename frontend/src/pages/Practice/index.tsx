import { useState, useEffect } from 'react';
import { AppLayout } from '@/shared/components/layout';
import { SpeakingPractice, WritingPractice } from './components';
import { practiceApi } from '@/services/practice';
import { Mic, PenLine, BookOpen, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';

type PracticeTab = 'speaking' | 'writing';
type SpeakingMode = 'pronunciation' | 'topic';
type WritingMode = 'exam' | 'custom' | 'generated';

export default function Practice() {
  const [activeTab, setActiveTab] = useState<PracticeTab>('speaking');
  const [speakingMode, setSpeakingMode] = useState<SpeakingMode>('pronunciation');
  const [writingMode, setWritingMode] = useState<WritingMode>('exam');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    practiceApi.getHealth()
      .then((health) => {
        setApiStatus(health.status === 'ok' ? 'online' : 'offline');
      })
      .catch(() => {
        setApiStatus('offline');
      });
  }, []);

  const speakingModes = [
    { id: 'pronunciation' as const, label: 'Tra phát âm', desc: 'Kiểm tra cách phát âm từ vựng' },
    { id: 'topic' as const, label: 'Luyện nói', desc: 'Nói theo chủ đề với AI đánh giá' },
  ];

  const writingModes = [
    { id: 'exam' as const, label: 'Đề thi', desc: 'Luyện với đề thi IELTS/TOEFL thực tế' },
    { id: 'custom' as const, label: 'Tự chọn', desc: 'Viết theo chủ đề bạn quan tâm' },
    { id: 'generated' as const, label: 'AI tạo đề', desc: 'Đề bài được AI tạo ngẫu nhiên' },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
            <p className="text-muted-foreground mt-1">
              Luyện Speaking và Writing với hỗ trợ từ AI
            </p>
          </div>
        </div>

        {/* API Status Warning */}
        {apiStatus === 'offline' && (
          <div className="border-b bg-amber-50">
            <div className="container mx-auto px-6 py-3 flex items-center gap-2 text-amber-800">
              <AlertCircle size={16} />
              <span className="text-sm">LLM API đang offline. Một số tính năng có thể không hoạt động.</span>
            </div>
          </div>
        )}

        <div className="container mx-auto px-6 py-8">
          {/* Tab Switch */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('speaking')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === 'speaking'
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
            >
              <Mic size={16} />
              Speaking
            </button>
            <button
              onClick={() => setActiveTab('writing')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === 'writing'
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
            >
              <PenLine size={16} />
              Writing
            </button>
          </div>

          {/* Mode Selection */}
          {activeTab === 'speaking' && (
            <div className="mb-8">
              <div className="flex gap-3">
                {speakingModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSpeakingMode(mode.id)}
                    className={`flex-1 max-w-xs text-left p-4 rounded-xl border transition-all ${speakingMode === mode.id
                        ? 'border-foreground bg-muted/50'
                        : 'border-border hover:border-foreground/30'
                      }`}
                  >
                    <div className="font-medium text-sm">{mode.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'writing' && (
            <div className="mb-8">
              <div className="flex gap-3">
                {writingModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setWritingMode(mode.id)}
                    className={`flex-1 max-w-xs text-left p-4 rounded-xl border transition-all ${writingMode === mode.id
                        ? 'border-foreground bg-muted/50'
                        : 'border-border hover:border-foreground/30'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {mode.id === 'exam' && <BookOpen size={14} />}
                      {mode.id === 'custom' && <MessageSquare size={14} />}
                      {mode.id === 'generated' && <Sparkles size={14} />}
                      <span className="font-medium text-sm">{mode.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="min-h-[500px]">
            {activeTab === 'speaking' && <SpeakingPractice mode={speakingMode} />}
            {activeTab === 'writing' && <WritingPractice mode={writingMode} />}
          </div>
        </div>

        {/* Tips Section */}
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-6 py-10">
            <div className="grid md:grid-cols-2 gap-12 max-w-3xl">
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Mic size={16} className="text-muted-foreground" />
                  Mẹo Speaking
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Tra phát âm từ mới trước khi luyện nói</li>
                  <li>• Chuẩn bị ý trong 30 giây trước khi bắt đầu</li>
                  <li>• Nói rõ ràng, giữ tốc độ vừa phải</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <PenLine size={16} className="text-muted-foreground" />
                  Mẹo Writing
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Task 1: 150+ từ, Task 2: 250+ từ</li>
                  <li>• Chia đoạn rõ ràng: mở bài – thân bài – kết luận</li>
                  <li>• Sử dụng từ nối để liên kết các ý</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
