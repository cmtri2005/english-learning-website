<?php

namespace App\Controllers;

use App\Core\RestApi;
use App\Models\Exam;
use App\Models\ExamQuestionGroup;
use App\Models\ExamQuestion;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\Account;
use App\Core\Cookies;
use App\Core\JwtHandler;
use Exception;

class ExamController
{
    /**
     * Get list of exams or specific exam detail including questions
     * GET /api/exams
     * GET /api/exams?id=1
     */
    public function index()
    {
        try {
            RestApi::setHeaders();
            $examId = isset($_GET['id']) ? (int) $_GET['id'] : null;

            if ($examId) {
                $this->show($examId);
            } else {
                $this->list();
            }
        } catch (Exception $e) {
            error_log('Exam index error: ' . $e->getMessage());
            RestApi::apiError('Error fetching exams', 500);
        }
    }

    private function list()
    {
        $exams = Exam::all();
        // Return lightweight list
        $data = array_map(function ($exam) {
        return [
                'exam_id' => $exam->exam_id,
                'title' => $exam->title,
                'description' => $exam->description,
                'duration_minutes' => $exam->duration_minutes,
                'total_questions' => $exam->total_questions,
                'type' => $exam->type,
            ];
        }, $exams);

        RestApi::apiResponse($data, 'Exams retrieved successfully', true, 200);
    }

    private function show($id)
    {
        $exam = Exam::find($id);
        if (!$exam) {
            RestApi::apiError('Exam not found', 404);
            return;
        }

        // Fetch Groups
        $groups = ExamQuestionGroup::findWhere(['exam_id' => $id]);

        // Fetch Questions
        $questions = ExamQuestion::findWhere(['exam_id' => $id]);

        // Organize data
        $groupsById = [];
        foreach ($groups as $g) {
            $groupsById[$g->group_id] = $g;
            $g->questions = []; // Init
        }

        $standaloneQuestions = [];

        foreach ($questions as $q) {
            // Remove correct answer and explanation
            unset($q->correct_answer);
            unset($q->explanation);
            // Decode JSON fields for frontend
            // Convert options from {"A": "A. text", "B": "B. text"} to ["A. text", "B. text"]
            $optionsObj = $q->getOptions();
            $q->options = array_values($optionsObj); // Convert to indexed array
            $q->image_urls = $q->getImageUrls();
            $q->audio_urls = $q->getAudioUrls();

            if ($q->group_id && isset($groupsById[$q->group_id])) {
                $groupsById[$q->group_id]->questions[] = $q;
            } else {
                $standaloneQuestions[] = $q;
            }
        }

        // Convert groups to array
        $groupsList = array_values($groupsById);

        RestApi::apiResponse([
            'exam_id' => $exam->exam_id,
            'title' => $exam->title,
            'description' => $exam->description,
            'duration_minutes' => $exam->duration_minutes,
            'total_questions' => $exam->total_questions,
            'type' => $exam->type,
            'audio_url' => $exam->audio_url,
            'groups' => $groupsList,
            'standalone_questions' => $standaloneQuestions
        ], 'Exam details retrieved', true, 200);
    }

    /**
     * Submit exam attempt
     * POST /api/exams/submit
     */
    public function submit()
    {
        try {
            RestApi::setHeaders();
            $userId = $this->getUserId();
            
            // TEMPORARY: Allow guest submissions for testing (use user_id = 1)
            if (!$userId) {
                $userId = 1; // Default test user
                // Uncomment below to require authentication:
                // RestApi::apiError('Unauthorized', 401);
                // return;
            }

            $body = RestApi::getBody();
            $examId = $body['exam_id'] ?? null;
            $answers = $body['answers'] ?? []; // Map of question_id => selected_option

            if (!$examId) {
                RestApi::apiError('Exam ID is required', 400);
                return;
            }

            $exam = Exam::find($examId);
            if (!$exam) {
                RestApi::apiError('Exam not found', 404);
                return;
            }

            // Fetch all questions for this exam
            $questions = ExamQuestion::findWhere(['exam_id' => $examId]);

            // Calculate Score
            $scoringService = new \App\Services\ExamScoringService();
            $scoreResult = $scoringService->calculateScore($questions, $answers);

            // Create Attempt
            // We create with scores immediately
            $attemptData = [
                'user_id' => $userId,
                'exam_id' => $examId,
                'status' => 'completed',
                'end_time' => date('Y-m-d H:i:s'),
                'score_listening' => $scoreResult['listening_score'],
                'score_reading' => $scoreResult['reading_score'],
                'total_score' => $scoreResult['total_score']
            ];

            $attempt = ExamAttempt::create($attemptData);

            if (!$attempt) {
                RestApi::apiError('Failed to save attempt', 500);
                return;
            }

            // Prepare Batch Insert for Answers
            $answerRows = [];
            foreach ($scoreResult['details'] as $detail) {
                $answerRows[] = [
                    'attempt_id' => $attempt->attempt_id,
                    'question_id' => $detail['question_id'],
                    'selected_option' => $detail['selected_option'],
                    'is_correct' => $detail['is_correct'] ? 1 : 0
                ];
            }

            if (!empty($answerRows)) {
                ExamAttemptAnswer::insertBatch($answerRows);
            }

            RestApi::apiResponse([
                'attempt_id' => $attempt->attempt_id,
                'total_score' => $attempt->total_score,
                'score_listening' => $attempt->score_listening,
                'score_reading' => $attempt->score_reading
            ], 'Exam submitted successfully', true, 200);

        } catch (Exception $e) {
            error_log('Submit exam error: ' . $e->getMessage());
            RestApi::apiError('Error submitting exam', 500);
        }
    }

    /**
     * Get result detail
     * GET /api/exams/result?attempt_id=1
     */
    public function result()
    {
        try {
            RestApi::setHeaders();
            $attemptId = isset($_GET['attempt_id']) ? (int) $_GET['attempt_id'] : null;
            $userId = $this->getUserId();
            
            // TEMPORARY: Allow guest access for testing
            if (!$userId) {
                $userId = 1; // Default test user
            }

            if (!$attemptId) {
                RestApi::apiError('Attempt ID is required', 400);
                return;
            }

            $attempt = ExamAttempt::find($attemptId);
            if (!$attempt) {
                RestApi::apiError('Attempt not found', 404);
                return;
            }

            // TEMPORARY: Skip permission check for testing
            // Check permission: only own attempt or admin
            // if ($attempt->user_id != $userId) {
            //     RestApi::apiError('Unauthorized access to result', 403);
            //     return;
            // }

            // Get Answers
            $attemptAnswers = ExamAttemptAnswer::findWhere(['attempt_id' => $attemptId]);
            $answerMap = []; // qId => answer obj
            foreach ($attemptAnswers as $ans) {
                $answerMap[$ans->question_id] = $ans;
            }

            // Get Exam Questions (with correct answers and explanations this time)
            $questions = ExamQuestion::findWhere(['exam_id' => $attempt->exam_id]);

            // Enrich questions with user answer
            $results = [];
            foreach ($questions as $q) {
                $userAns = $answerMap[$q->question_id] ?? null;
                $q->user_selected = $userAns ? $userAns->selected_option : null;
                $q->is_correct = $userAns ? (bool) $userAns->is_correct : false;
                $q->options = $q->getOptions();
                $q->image_urls = $q->getImageUrls();
                $q->audio_urls = $q->getAudioUrls();
                $results[] = $q;
            }

            // Also need Content Groups for context
            $groups = ExamQuestionGroup::findWhere(['exam_id' => $attempt->exam_id]);

            RestApi::apiResponse([
                'attempt' => $attempt,
                'questions' => $results,
                'groups' => $groups
            ], 'Results retrieved', true, 200);

        } catch (Exception $e) {
            error_log('Result error: ' . $e->getMessage());
            RestApi::apiError('Error fetching result', 500);
        }
    }

    private function getUserId()
    {
        $jwt = new JwtHandler($_ENV['JWT_SECRET'] ?? '');
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = trim(substr($authHeader, 7));
            try {
                $payload = $jwt->validateToken($token);
                return $payload['user_id'] ?? null;
            } catch (\Throwable $th) {
            }
        }
        $cookies = new Cookies();
        $userData = $cookies->decodeAuth();
        return $userData['user_id'] ?? null;
    }

    /**
     * Get current user's exam attempts with stats
     * GET /api/exams/my-attempts
     */
    public function myAttempts()
    {
        try {
            RestApi::setHeaders();
            $userId = $this->getUserId();
            
            if (!$userId) {
                RestApi::apiError('Unauthorized', 401);
                return;
            }

            // Fetch attempts with exam info using raw query for JOIN
            $pdo = \App\Helper\Database::getInstance();
            $stmt = $pdo->prepare("
                SELECT 
                    a.attempt_id,
                    a.exam_id,
                    e.title as exam_title,
                    e.type as exam_type,
                    a.total_score,
                    a.score_listening,
                    a.score_reading,
                    a.end_time,
                    a.status
                FROM exam_attempts a
                JOIN exams e ON a.exam_id = e.exam_id
                WHERE a.user_id = :user_id AND a.status = 'completed'
                ORDER BY a.end_time DESC
            ");
            $stmt->execute([':user_id' => $userId]);
            $attempts = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Calculate stats
            $totalAttempts = count($attempts);
            $bestScore = 0;
            $avgScore = 0;
            $totalScore = 0;

            foreach ($attempts as $attempt) {
                $score = (int)$attempt['total_score'];
                $totalScore += $score;
                if ($score > $bestScore) {
                    $bestScore = $score;
                }
            }

            if ($totalAttempts > 0) {
                $avgScore = round($totalScore / $totalAttempts);
            }

            RestApi::apiResponse([
                'attempts' => $attempts,
                'stats' => [
                    'total_attempts' => $totalAttempts,
                    'best_score' => $bestScore,
                    'avg_score' => $avgScore
                ]
            ], 'Exam attempts retrieved successfully', true, 200);

        } catch (Exception $e) {
            error_log('My attempts error: ' . $e->getMessage());
            RestApi::apiError('Error fetching attempts', 500);
        }
    }
}
