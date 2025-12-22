import { useState, useCallback, useRef } from 'react';
import {
  practiceApi,
  SpeakingTopic,
  SpeakingEvaluationResult,
  TopicListResponse,
} from '@/services/practice';

type PracticeMode = 'topic-select' | 'practicing' | 'recording' | 'evaluating' | 'result';

interface UseSpeakingState {
  mode: PracticeMode;
  topics: TopicListResponse | null;
  currentTopic: SpeakingTopic | null;
  transcript: string;
  evaluation: SpeakingEvaluationResult | null;
  isLoading: boolean;
  isRecording: boolean;
  error: string | null;
  recordingTime: number;
}

export function useSpeaking() {
  const [state, setState] = useState<UseSpeakingState>({
    mode: 'topic-select',
    topics: null,
    currentTopic: null,
    transcript: '',
    evaluation: null,
    isLoading: false,
    isRecording: false,
    error: null,
    recordingTime: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Select a topic
  const selectTopic = useCallback(async (topicId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const topic = await practiceApi.getSpeakingTopic(topicId);
      setState(prev => ({
        ...prev,
        currentTopic: topic,
        mode: 'practicing',
        isLoading: false,
        transcript: '',
        evaluation: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Không thể tải đề',
      }));
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second

      setState(prev => ({ ...prev, isRecording: true, recordingTime: 0, error: null }));

      // Timer
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Không thể truy cập microphone. Vui lòng cấp quyền.',
      }));
    }
  }, []);

  // Stop recording and transcribe
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setState(prev => ({ ...prev, isRecording: false, mode: 'evaluating', isLoading: true }));

        try {
          // Transcribe audio
          const transcribeResult = await practiceApi.transcribeAudio(audioBlob);
          
          if (transcribeResult.success && transcribeResult.transcript) {
            const transcript = transcribeResult.transcript!;
            setState(prev => ({ ...prev, transcript }));
            
            // Get current topic from state for evaluation
            setState(prev => {
              // Trigger evaluation with the transcript
              if (prev.currentTopic) {
                practiceApi.evaluateSpeaking(
                  prev.currentTopic.topic_id,
                  transcript,
                  prev.currentTopic.context
                ).then(evaluation => {
                  setState(p => ({
                    ...p,
                    evaluation,
                    mode: 'result',
                    isLoading: false,
                  }));
                }).catch(err => {
                  const errorMessage = err instanceof Error ? err.message : 'Lỗi khi đánh giá';
                  const isApiKeyError = errorMessage.includes('No Groq') || errorMessage.includes('API key') || errorMessage.includes('quota');
                  setState(p => ({
                    ...p,
                    mode: 'practicing',
                    isLoading: false,
                    error: isApiKeyError 
                      ? 'Chưa cấu hình GROQ API Key. Vui lòng xem hướng dẫn phía trên.'
                      : errorMessage,
                  }));
                });
              }
              return prev;
            });
          } else {
            throw new Error(transcribeResult.error || 'Transcription failed');
          }
        } catch (err) {
          setState(prev => ({
            ...prev,
            mode: 'practicing',
            isLoading: false,
            error: err instanceof Error ? err.message : 'Lỗi khi chuyển đổi giọng nói',
          }));
        }

        resolve();
      };

      mediaRecorderRef.current!.stop();
    });
  }, []);

  // Evaluate speaking
  const evaluateSpeaking = useCallback(async () => {
    if (!state.currentTopic || !state.transcript) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const evaluation = await practiceApi.evaluateSpeaking(
        state.currentTopic.topic_id,
        state.transcript,
        state.currentTopic.context
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
        isLoading: false,
        error: isApiKeyError 
          ? '⚠️ Chưa cấu hình GROQ API Key. Vui lòng xem hướng dẫn phía trên.'
          : errorMessage,
      }));
    }
  }, [state.currentTopic, state.transcript]);

  // Set transcript manually (for text input mode)
  const setTranscript = useCallback((transcript: string) => {
    setState(prev => ({ ...prev, transcript }));
  }, []);

  // Submit transcript for evaluation
  const submitTranscript = useCallback(async () => {
    if (!state.transcript.trim()) {
      setState(prev => ({ ...prev, error: 'Vui lòng nhập nội dung trả lời' }));
      return;
    }
    setState(prev => ({ ...prev, mode: 'evaluating' }));
    await evaluateSpeaking();
  }, [state.transcript, evaluateSpeaking]);

  // Reset to topic selection
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setState(prev => ({
      ...prev,
      mode: 'topic-select',
      currentTopic: null,
      transcript: '',
      evaluation: null,
      isRecording: false,
      recordingTime: 0,
      error: null,
    }));
  }, []);

  // Try another topic
  const tryAnother = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'topic-select',
      currentTopic: null,
      transcript: '',
      evaluation: null,
      error: null,
    }));
  }, []);

  return {
    mode: state.mode,
    topics: state.topics,
    currentTopic: state.currentTopic,
    transcript: state.transcript,
    evaluation: state.evaluation,
    isLoading: state.isLoading,
    isRecording: state.isRecording,
    error: state.error,
    recordingTime: state.recordingTime,
    loadTopics,
    selectTopic,
    startRecording,
    stopRecording,
    setTranscript,
    submitTranscript,
    evaluateSpeaking,
    reset,
    tryAnother,
  };
}

