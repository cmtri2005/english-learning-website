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

    /**
     * List all exams (admin only)
     * GET /api/admin/exams
     */
    public function getExams()
    {
        try {
            RestApi::setHeaders();
            
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Unauthorized', 401);
                return;
            }

            // Admin check would go here
            
            $search = $_GET['search'] ?? '';
            $type = $_GET['type'] ?? '';
            $page = (int)($_GET['page'] ?? 1);
            $perPage = (int)($_GET['per_page'] ?? 20);
            $offset = ($page - 1) * $perPage;

            $pdo = \App\Helper\Database::getInstance();
            
            // Build query
            $where = "1=1";
            $params = [];
            
            if ($search) {
                $where .= " AND (title LIKE :search OR description LIKE :search)";
                $params[':search'] = "%{$search}%";
            }
            if ($type) {
                $where .= " AND type = :type";
                $params[':type'] = $type;
            }
            
            // Count total
            $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM exams WHERE {$where}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch(\PDO::FETCH_ASSOC)['total'];
            
            // Fetch exams
            $stmt = $pdo->prepare("
                SELECT exam_id, title, description, type, duration_minutes, total_questions, year, created_at
                FROM exams 
                WHERE {$where}
                ORDER BY created_at DESC
                LIMIT {$perPage} OFFSET {$offset}
            ");
            $stmt->execute($params);
            $exams = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            RestApi::apiResponse([
                'exams' => $exams,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage)
                ]
            ], 'Success');

        } catch (Exception $e) {
            error_log('Get exams error: ' . $e->getMessage());
            RestApi::apiError('Failed to get exams', 500);
        }
    }

    /**
     * Delete exam (admin only)
     * DELETE /api/admin/exams/:id
     */
    public function deleteExam($id)
    {
        try {
            RestApi::setHeaders();
            
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Unauthorized', 401);
                return;
            }

            $pdo = \App\Helper\Database::getInstance();
            
            // Check exam exists
            $stmt = $pdo->prepare("SELECT exam_id FROM exams WHERE exam_id = :id");
            $stmt->execute([':id' => $id]);
            if (!$stmt->fetch()) {
                RestApi::apiError('Exam not found', 404);
                return;
            }
            
            // Delete exam (cascades to questions, groups, attempts via FK)
            $stmt = $pdo->prepare("DELETE FROM exams WHERE exam_id = :id");
            $stmt->execute([':id' => $id]);

            RestApi::apiResponse(null, 'Exam deleted successfully');

        } catch (Exception $e) {
            error_log('Delete exam error: ' . $e->getMessage());
            RestApi::apiError('Failed to delete exam', 500);
        }
    }

    /**
     * Create exam manually (admin only)
     * POST /api/admin/exams
     */
    public function createExam()
    {
        try {
            RestApi::setHeaders();
            
            $userId = RestApi::getCurrentUserId();
            if (!$userId) {
                RestApi::apiError('Unauthorized', 401);
                return;
            }

            $body = RestApi::getBody();
            
            // Validate required fields
            if (empty($body['title'])) {
                RestApi::apiError('Title is required', 400);
                return;
            }
            
            // Create exam
            $exam = Exam::create([
                'title' => $body['title'],
                'description' => $body['description'] ?? '',
                'type' => $body['type'] ?? 'readlis',
                'duration_minutes' => $body['duration_minutes'] ?? 120,
                'year' => $body['year'] ?? date('Y'),
                'total_questions' => 0
            ]);

            if (!$exam) {
                throw new Exception("Failed to create exam");
            }

            RestApi::apiResponse([
                'exam_id' => $exam->exam_id,
                'title' => $exam->title
            ], 'Exam created successfully', true, 201);

        } catch (Exception $e) {
            error_log('Create exam error: ' . $e->getMessage());
            RestApi::apiError('Failed to create exam', 500);
        }
    }
}
