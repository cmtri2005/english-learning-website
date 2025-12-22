import { useState, useCallback } from 'react';
import {
  practiceApi,
  WritingTopic,
  WritingEvaluationResult,
  TopicListResponse,
} from '@/services/practice';

type PracticeMode = 'topic-select' | 'writing' | 'evaluating' | 'result';
type TopicType = 'exam' | 'custom' | 'generated';

interface UseWritingState {
  mode: PracticeMode;
  topics: TopicListResponse | null;
  topicType: TopicType;
  currentTopic: WritingTopic | null;
  essay: string;
  evaluation: WritingEvaluationResult | null;
  isLoading: boolean;
  error: string | null;
  wordCount: number;
}

export function useWriting() {
  const [state, setState] = useState<UseWritingState>({
    mode: 'topic-select',
    topics: null,
    topicType: 'exam',
    currentTopic: null,
    essay: '',
    evaluation: null,
    isLoading: false,
    error: null,
    wordCount: 0,
  });

  // Load all topics
  const loadTopics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const topics = await practiceApi.getTopics();
      setState(prev => ({ ...prev, topics, isLoading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Không thể tải danh sách đề',
      }));
    }
  }, []);

  // Set topic type
  const setTopicType = useCallback((type: TopicType) => {
    setState(prev => ({ ...prev, topicType: type }));
  }, []);

  // Select a topic
  const selectTopic = useCallback(async (topicId?: string, category?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const topic = await practiceApi.getWritingTopic(state.topicType, topicId, category);
      setState(prev => ({
        ...prev,
        currentTopic: topic,
        mode: 'writing',
        isLoading: false,
        essay: '',
        evaluation: null,
        wordCount: 0,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Không thể tải đề',
      }));
    }
  }, [state.topicType]);

  // Generate a random topic
  const generateTopic = useCallback(async (category?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, topicType: 'generated' }));
    try {
      const topic = await practiceApi.getWritingTopic('generated', undefined, category);
      setState(prev => ({
        ...prev,
        currentTopic: topic,
        mode: 'writing',
        isLoading: false,
        essay: '',
        evaluation: null,
        wordCount: 0,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo đề';
      const isApiKeyError = errorMessage.includes('No Groq') || errorMessage.includes('API key') || errorMessage.includes('quota');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: isApiKeyError 
          ? '⚠️ Chưa cấu hình GROQ API Key. Vui lòng xem hướng dẫn phía trên.'
          : errorMessage,
      }));
    }
  }, []);

  // Update essay
  const setEssay = useCallback((essay: string) => {
    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    setState(prev => ({ ...prev, essay, wordCount }));
  }, []);

  // Submit essay for evaluation
  const submitEssay = useCallback(async () => {
    if (!state.currentTopic || !state.essay.trim()) {
      setState(prev => ({ ...prev, error: 'Vui lòng viết bài trước khi nộp' }));
      return;
    }

    if (state.wordCount < 50) {
      setState(prev => ({ ...prev, error: 'Bài viết quá ngắn. Vui lòng viết ít nhất 50 từ.' }));
      return;
    }

    setState(prev => ({ ...prev, mode: 'evaluating', isLoading: true, error: null }));

    try {
      const evaluation = await practiceApi.evaluateWriting(
        state.currentTopic.topic_id,
        state.currentTopic.context,
        state.essay
      );

      setState(prev => ({
        ...prev,
        evaluation,
        mode: 'result',
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi đánh giá';
      const isApiKeyError = errorMessage.includes('No Groq') || errorMessage.includes('API key') || errorMessage.includes('quota');
      
      setState(prev => ({
        ...prev,
        mode: 'writing',
        isLoading: false,
        error: isApiKeyError 
          ? '⚠️ Chưa cấu hình GROQ API Key. Vui lòng xem hướng dẫn phía trên.'
          : errorMessage,
      }));
    }
  }, [state.currentTopic, state.essay, state.wordCount]);

  // Reset to topic selection
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'topic-select',
      currentTopic: null,
      essay: '',
      evaluation: null,
      wordCount: 0,
      error: null,
    }));
  }, []);

  // Try another topic
  const tryAnother = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'topic-select',
      currentTopic: null,
      essay: '',
      evaluation: null,
      wordCount: 0,
      error: null,
    }));
  }, []);

  return {
    mode: state.mode,
    topics: state.topics,
    topicType: state.topicType,
    currentTopic: state.currentTopic,
    essay: state.essay,
    evaluation: state.evaluation,
    isLoading: state.isLoading,
    error: state.error,
    wordCount: state.wordCount,
    loadTopics,
    setTopicType,
    selectTopic,
    generateTopic,
    setEssay,
    submitEssay,
    reset,
    tryAnother,
  };
}

