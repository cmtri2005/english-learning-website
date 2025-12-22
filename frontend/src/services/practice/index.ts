/**
 * Practice API Service
 * 
 * API client for LLM API (Speaking, Writing, Pronunciation practice)
 */

const LLM_API_URL = import.meta.env.VITE_LLM_API_URL || 'http://localhost:8002';

// ==================== Types ====================

export interface SpeakingTopic {
  topic_id: string;
  test_name: string;
  question_type: string;
  context: string;
  image_urls: string[];
}

export interface WritingTopic {
  topic_id: string;
  topic_type: string;
  test_name?: string;
  question_type: string;
  context: string;
  category?: string;
  prompt_type?: string;
}

export interface WordMeaning {
  type: string;
  meaning: string;
}

export interface PronunciationInfo {
  word: string;
  ipa: string | null;
  audio_url: string | null;
  found: boolean;
  meanings?: WordMeaning[];
  generated?: boolean;
}

export interface PronunciationTips {
  word: string;
  ipa: string | null;
  tips: string;
  common_mistakes: string[];
  similar_sounds: string[];
}

export interface RelatedWord {
  word: string;
  ipa: string | null;
  meanings: WordMeaning[];
}

export interface RelatedWordsResponse {
  word: string;
  related_words: RelatedWord[];
  synonyms: string[];
  antonyms: string[];
}

export interface WordSuggestion {
  word: string;
  ipa: string | null;
}

export interface AutocompleteResponse {
  query: string;
  suggestions: WordSuggestion[];
}

export interface TopicListResponse {
  speaking_topics: { id: string; name: string }[];
  writing_exam_topics: { id: string; name: string }[];
  writing_custom_topics: { id: string; category: string; type: string }[];
}

export interface SpeakingEvaluationResult {
  topic_id: string;
  transcript: string;
  success: boolean;
  error?: string;
  scores?: {
    pronunciation: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    content: number;
    topic_matching: number;
    overall: number;
    is_off_topic: boolean;
  };
  feedback?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    vietnamese_tips: string[];
    errors: Array<{
      type: string;
      text: string;
      issue?: string;
      suggestion?: string;
      correction?: string;
      rule?: string;
    }>;
    suggestions: string[];
    is_off_topic: boolean;
    off_topic_warning: string;
  };
  layers?: Record<string, unknown>;
}

export interface WritingEvaluationResult {
  topic_id: string;
  essay: string;
  task_achievement_score: number;
  coherence_cohesion_score: number;
  lexical_resource_score: number;
  grammar_accuracy_score: number;
  overall_score: number;
  feedback: string;
  errors: Array<{
    type: string;
    text: string;
    correction?: string;
    explanation?: string;
  }>;
  suggestions: string[];
  improved_version?: string;
}

export interface TranscribeResult {
  success: boolean;
  transcript?: string;
  error?: string;
  duration?: number;
  language?: string;
}

export interface HealthStatus {
  status: string;
  minio_connected: boolean;
  data_loaded: boolean;
}

// ==================== API Client ====================

class PracticeApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return response.json();
  }

  // Health check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Topics
  async getTopics(): Promise<TopicListResponse> {
    return this.request<TopicListResponse>('/topics');
  }

  // Speaking
  async getSpeakingTopic(topicId?: string): Promise<SpeakingTopic> {
    return this.request<SpeakingTopic>('/speaking/topic', {
      method: 'POST',
      body: JSON.stringify({ topic_id: topicId || null }),
    });
  }

  async evaluateSpeaking(
    topicId: string,
    transcript: string,
    topicContext?: string
  ): Promise<SpeakingEvaluationResult> {
    return this.request<SpeakingEvaluationResult>('/speaking/evaluate-full', {
      method: 'POST',
      body: JSON.stringify({
        topic_id: topicId,
        transcript,
        topic_context: topicContext,
      }),
    });
  }

  async transcribeAudio(audioBlob: Blob, filename?: string): Promise<TranscribeResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename || 'audio.webm');

    const response = await fetch(`${this.baseUrl}/speaking/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
      throw new Error(error.detail || 'Transcription failed');
    }

    return response.json();
  }

  // Writing
  async getWritingTopic(
    topicType: 'exam' | 'custom' | 'generated' = 'exam',
    topicId?: string,
    category?: string
  ): Promise<WritingTopic> {
    return this.request<WritingTopic>('/writing/topic', {
      method: 'POST',
      body: JSON.stringify({
        topic_type: topicType,
        topic_id: topicId || null,
        category: category || null,
      }),
    });
  }

  async evaluateWriting(
    topicId: string,
    topicContext: string,
    essay: string
  ): Promise<WritingEvaluationResult> {
    return this.request<WritingEvaluationResult>('/writing/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        topic_id: topicId,
        topic_context: topicContext,
        essay,
      }),
    });
  }

  // Pronunciation
  async getPronunciation(word: string, generate: boolean = true): Promise<PronunciationInfo> {
    const params = generate ? '' : '?generate=false';
    return this.request<PronunciationInfo>(`/pronunciation/${encodeURIComponent(word)}${params}`);
  }

  async getPronunciationTips(word: string): Promise<PronunciationTips> {
    return this.request<PronunciationTips>(`/pronunciation/${encodeURIComponent(word)}/tips`);
  }

  async getRelatedWords(word: string): Promise<RelatedWordsResponse> {
    return this.request<RelatedWordsResponse>(`/pronunciation/${encodeURIComponent(word)}/related`);
  }

  async searchWords(query: string, limit: number = 10): Promise<AutocompleteResponse> {
    return this.request<AutocompleteResponse>(
      `/pronunciation/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  getPronunciationAudioUrl(word: string): string {
    return `${this.baseUrl}/pronunciation/${encodeURIComponent(word)}/audio`;
  }
}

export const practiceApi = new PracticeApiClient(LLM_API_URL);

