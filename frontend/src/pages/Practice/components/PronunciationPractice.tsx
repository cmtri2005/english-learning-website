import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { usePronunciation } from '../hooks';

export function PronunciationPractice() {
  const {
    word,
    pronunciation,
    tips,
    relatedWords,
    suggestions,
    showSuggestions,
    isLoading,
    isLoadingTips,
    isLoadingRelated,
    isPlaying,
    error,
    history,
    setWord,
    lookupWord,
    playAudio,
    selectFromHistory,
    selectSuggestion,
    hideSuggestions,
    clearHistory,
  } = usePronunciation();

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      lookupWord();
    }
    if (e.key === 'Escape') {
      hideSuggestions();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        hideSuggestions();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hideSuggestions]);

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-medium">Tra phát âm từ vựng</h2>

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Nhập từ tiếng Anh..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => word.length > 0 && suggestions.length > 0 && setWord(word)}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.word}-${index}`}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between text-sm transition-colors"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <span>{suggestion.word}</span>
                      {suggestion.ipa && (
                        <span className="text-xs text-muted-foreground font-mono">/{suggestion.ipa}/</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => lookupWord()} disabled={isLoading || !word.trim()}>
              {isLoading ? 'Đang tra...' : 'Tra'}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Quick Practice Words */}
        <div className="flex flex-wrap gap-1.5">
          {['hello', 'world', 'beautiful', 'technology', 'environment', 'pronunciation'].map((w) => (
            <button
              key={w}
              className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors"
              onClick={() => {
                setWord(w);
                lookupWord(w);
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Result Section */}
      {pronunciation && pronunciation.found && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{pronunciation.word}</h3>
                {pronunciation.generated && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">AI</span>
                )}
              </div>
              {pronunciation.ipa && (
                <p className="text-muted-foreground font-mono mt-1">/{pronunciation.ipa}/</p>
              )}
            </div>
            <Button variant="outline" onClick={playAudio} disabled={isPlaying}>
              {isPlaying ? 'Đang phát...' : 'Nghe'}
            </Button>
          </div>

          {/* Meanings */}
          {pronunciation.meanings && pronunciation.meanings.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <h4 className="text-sm text-muted-foreground">Nghĩa:</h4>
              <div className="space-y-1.5">
                {pronunciation.meanings.map((m, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0 min-w-[80px]">({m.type})</span>
                    <span>{m.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tips Section */}
          <div className="p-4 bg-muted/50 rounded-md">
            {isLoadingTips ? (
              <p className="text-sm text-muted-foreground">Đang tạo mẹo phát âm...</p>
            ) : tips ? (
              <div className="space-y-3">
                <p className="text-sm">{tips.tips}</p>

                {tips.common_mistakes.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Lỗi thường gặp: </span>
                    <span className="text-muted-foreground">{tips.common_mistakes.join(', ')}</span>
                  </div>
                )}

                {tips.similar_sounds.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Từ tương tự: </span>
                    {tips.similar_sounds.map((w, i) => (
                      <button
                        key={i}
                        className="hover:underline mx-1"
                        onClick={() => {
                          setWord(w);
                          lookupWord(w);
                        }}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Lắng nghe cách phát âm và thử lặp lại. Chú ý đến trọng âm và các âm cuối từ.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Related Words Section */}
      {pronunciation?.found && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-medium">Các từ liên quan</h3>
          {isLoadingRelated ? (
            <p className="text-sm text-muted-foreground">Đang tìm các từ liên quan...</p>
          ) : relatedWords && relatedWords.related_words.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {relatedWords.related_words.map((related, index) => (
                <button
                  key={`${related.word}-${index}`}
                  className="px-3 py-2 border rounded-md text-sm hover:bg-muted transition-colors text-left"
                  onClick={() => {
                    setWord(related.word);
                    lookupWord(related.word);
                  }}
                >
                  <div>{related.word}</div>
                  {related.ipa && (
                    <div className="text-xs text-muted-foreground font-mono">/{related.ipa}/</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không tìm thấy từ liên quan trong từ điển.</p>
          )}
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Lịch sử tra cứu</h3>
            <button
              onClick={clearHistory}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Xóa
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((item, index) => (
              <button
                key={`${item.word}-${index}`}
                className="px-3 py-1.5 border rounded-md text-xs hover:bg-muted transition-colors"
                onClick={() => selectFromHistory(item)}
              >
                {item.word}
                {item.ipa && <span className="ml-1 text-muted-foreground font-mono">/{item.ipa}/</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
