import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  practiceApi, 
  PronunciationInfo, 
  PronunciationTips, 
  RelatedWordsResponse,
  WordSuggestion 
} from '@/services/practice';

interface UsePronunciationState {
  word: string;
  pronunciation: PronunciationInfo | null;
  tips: PronunciationTips | null;
  relatedWords: RelatedWordsResponse | null;
  suggestions: WordSuggestion[];
  isLoading: boolean;
  isLoadingTips: boolean;
  isLoadingRelated: boolean;
  isPlaying: boolean;
  error: string | null;
  history: PronunciationInfo[];
  showSuggestions: boolean;
}

export function usePronunciation() {
  const [state, setState] = useState<UsePronunciationState>({
    word: '',
    pronunciation: null,
    tips: null,
    relatedWords: null,
    suggestions: [],
    isLoading: false,
    isLoadingTips: false,
    isLoadingRelated: false,
    isPlaying: false,
    error: null,
    history: [],
    showSuggestions: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setWord = useCallback((word: string) => {
    setState(prev => ({ ...prev, word, showSuggestions: word.length > 0 }));
    
    // Debounced autocomplete search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (word.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await practiceApi.searchWords(word.trim(), 8);
          setState(prev => ({ 
            ...prev, 
            suggestions: result.suggestions,
            showSuggestions: true 
          }));
        } catch {
          // Ignore autocomplete errors
        }
      }, 200);
    } else {
      setState(prev => ({ ...prev, suggestions: [], showSuggestions: false }));
    }
  }, []);

  const hideSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, showSuggestions: false }));
  }, []);

  const lookupWord = useCallback(async (wordToLookup?: string) => {
    const word = wordToLookup || state.word;
    if (!word.trim()) {
      setState(prev => ({ ...prev, error: 'Vui lòng nhập từ cần tra' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      isLoadingTips: true,
      isLoadingRelated: true,
      error: null,
      tips: null,
      relatedWords: null,
      showSuggestions: false
    }));

    try {
      // Get pronunciation first
      const result = await practiceApi.getPronunciation(word.trim().toLowerCase());
      
      setState(prev => ({
        ...prev,
        pronunciation: result,
        isLoading: false,
        error: result.found ? null : 'Không tìm thấy trong từ điển, đang tạo bằng AI...',
        history: result.found 
          ? [result, ...prev.history.filter(h => h.word !== result.word).slice(0, 9)]
          : prev.history,
      }));

      // If pronunciation was generated or found, clear error
      if (result.found) {
        setState(prev => ({ ...prev, error: null }));
      }

      // Load tips and related words in parallel
      const loadTips = async () => {
        try {
          const tips = await practiceApi.getPronunciationTips(word.trim().toLowerCase());
          setState(prev => ({ ...prev, tips, isLoadingTips: false }));
        } catch {
          setState(prev => ({ ...prev, isLoadingTips: false }));
        }
      };

      const loadRelated = async () => {
        try {
          const related = await practiceApi.getRelatedWords(word.trim().toLowerCase());
          setState(prev => ({ ...prev, relatedWords: related, isLoadingRelated: false }));
        } catch {
          setState(prev => ({ ...prev, isLoadingRelated: false }));
        }
      };

      // Load both in parallel
      Promise.all([loadTips(), loadRelated()]);

    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingTips: false,
        isLoadingRelated: false,
        error: err instanceof Error ? err.message : 'Lỗi khi tra từ',
      }));
    }
  }, [state.word]);

  const playAudio = useCallback(async () => {
    if (!state.pronunciation?.found) return;

    setState(prev => ({ ...prev, isPlaying: true }));

    try {
      const audioUrl = practiceApi.getPronunciationAudioUrl(state.pronunciation.word);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };
      audioRef.current.onerror = () => {
        setState(prev => ({ ...prev, isPlaying: false, error: 'Không thể phát âm thanh' }));
      };
      
      await audioRef.current.play();
    } catch {
      setState(prev => ({ ...prev, isPlaying: false, error: 'Không thể phát âm thanh' }));
    }
  }, [state.pronunciation]);

  const selectFromHistory = useCallback((pron: PronunciationInfo) => {
    setState(prev => ({
      ...prev,
      word: pron.word,
      pronunciation: pron,
      error: null,
      showSuggestions: false,
    }));
    // Also load tips and related for the selected word
    lookupWord(pron.word);
  }, [lookupWord]);

  const selectSuggestion = useCallback((suggestion: WordSuggestion) => {
    setState(prev => ({
      ...prev,
      word: suggestion.word,
      showSuggestions: false,
    }));
    lookupWord(suggestion.word);
  }, [lookupWord]);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  const reset = useCallback(() => {
    setState({
      word: '',
      pronunciation: null,
      tips: null,
      relatedWords: null,
      suggestions: [],
      isLoading: false,
      isLoadingTips: false,
      isLoadingRelated: false,
      isPlaying: false,
      error: null,
      history: state.history, // Keep history
      showSuggestions: false,
    });
  }, [state.history]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    word: state.word,
    pronunciation: state.pronunciation,
    tips: state.tips,
    relatedWords: state.relatedWords,
    suggestions: state.suggestions,
    showSuggestions: state.showSuggestions,
    isLoading: state.isLoading,
    isLoadingTips: state.isLoadingTips,
    isLoadingRelated: state.isLoadingRelated,
    isPlaying: state.isPlaying,
    error: state.error,
    history: state.history,
    setWord,
    lookupWord,
    playAudio,
    selectFromHistory,
    selectSuggestion,
    hideSuggestions,
    clearHistory,
    reset,
  };
}
