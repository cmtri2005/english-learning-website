import { useState, useEffect } from 'react';
import { AppLayout } from '@/shared/components/layout';
import { SpeakingPractice, WritingPractice } from './components';
import { practiceApi } from '@/services/practice';

type PracticeTab = 'speaking' | 'writing';
type SpeakingMode = 'pronunciation' | 'topic';
type WritingMode = 'exam' | 'custom' | 'generated';

export default function Practice() {
  const [activeTab, setActiveTab] = useState<PracticeTab>('speaking');
  const [speakingExpanded, setSpeakingExpanded] = useState(true);
  const [writingExpanded, setWritingExpanded] = useState(false);
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

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-xl font-semibold">Luyện Speaking & Writing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tra phát âm, luyện nói và viết với AI đánh giá
            </p>
          </div>
        </header>

        {/* API Status - minimal */}
        {apiStatus === 'offline' && (
          <div className="border-b">
            <div className="container mx-auto px-4 py-3">
              <p className="text-sm text-muted-foreground">
                LLM API đang offline. Đảm bảo container llm-api đang chạy.
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex gap-6 h-full">
            {/* Sidebar Navigation with Dropdown */}
            <aside className="w-56 shrink-0">
              {/* Speaking Section */}
              <div className="mb-2">
                <button
                  className="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted flex items-center justify-between"
                  onClick={() => {
                    setSpeakingExpanded(!speakingExpanded);
                    setWritingExpanded(false);
                    setActiveTab('speaking');
                  }}
                >
                  <span>Speaking</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${speakingExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {speakingExpanded && (
                  <div className="mt-1 ml-3 pl-3 border-l space-y-1">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'speaking' && speakingMode === 'pronunciation'
                          ? 'bg-muted'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setActiveTab('speaking');
                        setSpeakingMode('pronunciation');
                      }}
                    >
                      Phát âm từ vựng
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'speaking' && speakingMode === 'topic'
                          ? 'bg-muted'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setActiveTab('speaking');
                        setSpeakingMode('topic');
                      }}
                    >
                      Luyện nói theo đề
                    </button>
                  </div>
                )}
              </div>

              {/* Writing Section */}
              <div>
                <button
                  className="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted flex items-center justify-between"
                  onClick={() => {
                    setWritingExpanded(!writingExpanded);
                    setSpeakingExpanded(false);
                    setActiveTab('writing');
                  }}
                >
                  <span>Writing</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${writingExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {writingExpanded && (
                  <div className="mt-1 ml-3 pl-3 border-l space-y-1">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'writing' && writingMode === 'exam'
                          ? 'bg-muted'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setActiveTab('writing');
                        setWritingMode('exam');
                      }}
                    >
                      Đề thi
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'writing' && writingMode === 'custom'
                          ? 'bg-muted'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setActiveTab('writing');
                        setWritingMode('custom');
                      }}
                    >
                      Theo chủ đề
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'writing' && writingMode === 'generated'
                          ? 'bg-muted'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setActiveTab('writing');
                        setWritingMode('generated');
                      }}
                    >
                      AI tạo đề
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1">
              {activeTab === 'speaking' && <SpeakingPractice mode={speakingMode} />}
              {activeTab === 'writing' && <WritingPractice mode={writingMode} />}
            </div>
          </div>
        </main>

        {/* Footer Tips */}
        <footer className="border-t">
          <div className="container mx-auto px-4 py-6">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-sm font-medium mb-3">Mẹo Speaking</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>Tra phát âm từ mới trước khi luyện</li>
                  <li>Đọc kỹ đề và chuẩn bị ý trong 30 giây</li>
                  <li>Nói rõ ràng, không quá nhanh</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">Mẹo Writing</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>Viết ít nhất 150-250 từ</li>
                  <li>Chia đoạn rõ ràng: mở - thân - kết</li>
                  <li>Sử dụng từ nối để liên kết ý</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
