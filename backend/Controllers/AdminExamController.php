<?php

namespace App\Controllers;

use App\Core\RestApi;
use App\Models\Exam;
use App\Models\ExamQuestionGroup;
use App\Models\ExamQuestion;
use Exception;

class AdminExamController
{
    /**
     * Import Exam from JSON
     * POST /api/admin/exams/import
     */
    public function import()
    {
        try {
            RestApi::setHeaders();
            
            // Auth check (Simple role check for now)
            // if (!$user || $user->role !== 'admin') ...

            $body = RestApi::getBody();
            
            // Debug Log
            $rawInput = file_get_contents('php://input');
            error_log('Import Payload detected. Size: ' . strlen($rawInput));

            // DETECT FORMAT
            $isStudy4 = isset($body['globalAudio']) || (isset($body['parts'][0]['partId']));
            
            $examData = [];
            $questionsToCreate = [];

            if ($isStudy4) {
                // --- MAPPING STUDY4 FORMAT ---
                $examData = [
                    'title' => $body['title'] ?? 'Imported Exam ' . date('Y-m-d H:i'),
                    'description' => 'Imported from external source',
                    'duration_minutes' => 120, // Default
                    'year' => $body['year'] ?? date('Y'),
                    'total_questions' => 0
                ];

                $parts = $body['parts'] ?? [];
            } else {
                // --- STANDARD FORMAT ---
                if (empty($body['title']) || empty($body['parts'])) {
                     $debugInfo = [
                        'received_keys' => array_keys($body),
                        'json_last_error' => json_last_error_msg()
                    ];
                    RestApi::apiResponse($debugInfo, 'Invalid JSON format. Title and Parts are required.', false, 400);
                    return;
                }

                $examData = [
                    'title' => $body['title'],
                    'description' => $body['description'] ?? '',
                    'duration_minutes' => $body['duration_minutes'] ?? 120,
                    'year' => $body['year'] ?? date('Y'),
                    'total_questions' => 0
                ];
                $parts = $body['parts'];
            }

            // Create Exam Record
            $exam = Exam::create($examData);
            if (!$exam) {
                throw new Exception("Failed to create exam record");
            }

            $totalQuestions = 0;

            foreach ($parts as $part) {
                // Determine Part Number
                $partNumber = $part['part_number'] ?? null;
                if (!$partNumber && isset($part['partName'])) {
                    // Extract "1" from "Part 1"
                    if (preg_match('/Part (\d+)/i', $part['partName'], $matches)) {
                        $partNumber = (int)$matches[1];
                    }
                }
                if (!$partNumber) $partNumber = 1; // Fallback

                // Determine Questions
                // Study4 format has 'questions' array directly in part
                // Standard format has 'groups' or 'questions'
                
                $groups = $part['groups'] ?? [];
                $standaloneQuestions = $part['questions'] ?? [];

                // 1. Process Groups
                foreach ($groups as $groupData) {
                    $group = ExamQuestionGroup::create([
                        'exam_id' => $exam->exam_id,
                        'part_number' => $partNumber,
                        'content_text' => $groupData['content_text'] ?? null,
                        'image_url' => $groupData['image_url'] ?? null,
                        'audio_url' => $groupData['audio_url'] ?? null,
                        'transcript' => $groupData['transcript'] ?? null
                    ]);

                    if (isset($groupData['questions'])) {
                        foreach ($groupData['questions'] as $qData) {
                            $this->createQuestion($exam->exam_id, $partNumber, $qData, $group->group_id);
                            $totalQuestions++;
                        }
                    }
                }

                // 2. Process Standalone Questions (or Study4 Questions)
                foreach ($standaloneQuestions as $qData) {
                    // Study4 might have images/audio at question level -> treat as standalone question
                    // If Study4 question has 'image', passing it to 'question_text' might strictly not be enough if we want to show image.
                    // But our ExamQuestion model doesn't have image_url column? 
                    // Let's check init.sql or assume ExamQuestion is text-only?
                    // Actually, usually Part 1 questions ARE grouped by image, or the question ITSELF has an image.
                    // My Schema: `exam_question_groups` has `image_url`. `exam_questions` does NOT.
                    // So if a Study4 question has an image, I should wrap it in a GROUP.
                    
                    if ($isStudy4 && !empty($qData['image'])) {
                        // Create a synthetic group for this question
                         $group = ExamQuestionGroup::create([
                            'exam_id' => $exam->exam_id,
                            'part_number' => $partNumber,
                            'image_url' => $qData['image'],
                            'audio_url' => $part['audio'] ?? null // Part-level audio? Or question level?
                        ]);
                         $this->createQuestion($exam->exam_id, $partNumber, $qData, $group->group_id, $isStudy4);
                         $totalQuestions++;
                    } else {
                        // Regular standalone
                        $this->createQuestion($exam->exam_id, $partNumber, $qData, null, $isStudy4);
                        $totalQuestions++;
                    }
                }
            }

            // Update Total
            Exam::update($exam->exam_id, ['total_questions' => $totalQuestions]);

            RestApi::apiResponse(['exam_id' => $exam->exam_id], 'Exam imported successfully', true, 201);

        } catch (Exception $e) {
            error_log('Import Error: ' . $e->getMessage());
            RestApi::apiError('Failed to import exam: ' . $e->getMessage(), 500);
        }
    }

    private function createQuestion($examId, $partNumber, $qData, $groupId = null, $isStudy4 = false)
    {
        $options = [];
        $correctAnswer = 'A'; // Default
        
        if ($isStudy4) {
             // Map Study4 'answers' to options
             if (isset($qData['answers']) && is_array($qData['answers'])) {
                 foreach ($qData['answers'] as $ans) {
                     // If text is present, format "A. text". If not, just "A" (Part 1/2)
                     if (!empty($ans['text'])) {
                         $options[] = $ans['option'] . ". " . $ans['text'];
                     } else {
                         $options[] = $ans['option'];
                     }
                 }
             }
             // Try to find correct answer? Study4 JSON often hides it or it's 'correct' property
             if (isset($qData['correctAnswer'])) $correctAnswer = $qData['correctAnswer'];
             // Fallback: If we can't find it, we default to A.
             
        } else {
            $options = $qData['options'];
            $correctAnswer = $qData['correct_answer'];
        }

        ExamQuestion::create([
            'exam_id' => $examId,
            'group_id' => $groupId,
            'part_number' => $partNumber,
            'question_number' => $qData['question_number'] ?? ($qData['number'] ?? 0),
            'question_text' => $qData['question_text'] ?? ($qData['questionText'] ?? 'Question ' . ($qData['number']??'')),
            'options' => json_encode($options),
            'correct_answer' => $correctAnswer,
            'explanation' => $qData['explanation'] ?? null
        ]);
    }
}
