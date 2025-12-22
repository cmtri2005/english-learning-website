import { api, ApiResponse } from './api';

export interface Exam {
    exam_id: number;
    title: string;
    description: string;
    duration_minutes: number;
    total_questions: number;
    type?: 'readlis' | 'speaking' | 'writing';
}

export interface ExamDetail extends Exam {
    groups: ExamQuestionGroup[];
    standalone_questions: ExamQuestion[];
    audio_url?: string;
}

export interface ExamQuestionGroup {
    group_id: number;
    part_number: number;
    content_text?: string;
    image_url?: string;
    audio_url?: string;
    transcript?: string;
    questions: ExamQuestion[];
}

export interface ExamQuestion {
    question_id: number;
    part_number: number;
    question_number: number;
    question_text?: string;
    options: string[]; // ["A", "B", "C", "D"]
    user_selected?: string;
    is_correct?: boolean;
    correct_answer?: string;
    explanation?: string;
    // New fields
    question_type?: string;
    image_urls?: string[];
    audio_urls?: string[];
}

export interface ExamAttempt {
    attempt_id: number;
    score_listening: number;
    score_reading: number;
    total_score: number;
}

export interface ExamResult {
    attempt: ExamAttempt;
    questions: ExamQuestion[];
    groups: ExamQuestionGroup[];
}

export const examService = {
    getExams: async (): Promise<ApiResponse<Exam[]>> => {
        return api.examRequest<Exam[]>('/api/exams');
    },

    getExamDetail: async (id: number): Promise<ApiResponse<ExamDetail>> => {
        return api.examRequest<ExamDetail>(`/api/exams?id=${id}`);
    },

    submitExam: async (examId: number, answers: Record<number, string>): Promise<ApiResponse<ExamAttempt>> => {
        return api.examRequest<ExamAttempt>('/api/exams/submit', {
            method: 'POST',
            body: JSON.stringify({ exam_id: examId, answers }),
        });
    },

    getExamResult: async (attemptId: number): Promise<ApiResponse<ExamResult>> => {
        return api.examRequest<ExamResult>(`/api/exams/result?attempt_id=${attemptId}`);
    }
};
