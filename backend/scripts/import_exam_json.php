<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Models\Exam;
use App\Models\ExamQuestionGroup;
use App\Models\ExamQuestion;
use Dotenv\Dotenv;

// Initialize Environment
$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();

// Paths
$jsonPath = dirname(__DIR__, 2) . '/exam_sample.json';

if (!file_exists($jsonPath)) {
    die("Error: File not found at $jsonPath\n");
}

$jsonData = file_get_contents($jsonPath);
$data = json_decode($jsonData, true);

if (!$data) {
    die("Error: Invalid JSON data\n");
}

echo "Importing Exam: " . $data['title'] . "\n";

// 1. Create Exam
try {
    $exam = new Exam();
    $exam->title = $data['title'];
    $exam->description = $data['description'];
    $exam->duration_minutes = $data['duration_minutes'];
    $exam->total_questions = 0; // Will calculate
    $exam->year = date('Y');
    
    if (!$exam->save()) {
        die("Error: Failed to save exam\n");
    }
    
    $examId = $exam->exam_id;
    echo "Exam created with ID: $examId\n";
    
    $totalQuestions = 0;
    
    // 2. Process Parts
    foreach ($data['parts'] as $part) {
        $partNumber = $part['part_number'];
        echo "Processing Part $partNumber...\n";
        
        // Handle Groups
        if (isset($part['groups'])) {
            foreach ($part['groups'] as $groupData) {
                // Create Group
                $group = new ExamQuestionGroup();
                $group->exam_id = $examId;
                $group->part_number = $partNumber;
                $group->content_text = $groupData['content_text'] ?? null;
                $group->image_url = $groupData['image_url'] ?? null;
                $group->audio_url = $groupData['audio_url'] ?? null;
                $group->transcript = $groupData['transcript'] ?? null;
                
                if (!$group->save()) {
                    echo "Warning: Failed to save group in Part $partNumber\n";
                    continue;
                }
                
                $groupId = $group->group_id;
                
                // Questions in Group
                if (isset($groupData['questions'])) {
                    foreach ($groupData['questions'] as $qData) {
                        createQuestion($qData, $examId, $partNumber, $groupId);
                        $totalQuestions++;
                    }
                }
            }
        }
        
        // Handle Standalone Questions (if any/mixed)
        if (isset($part['questions'])) {
            foreach ($part['questions'] as $qData) {
                createQuestion($qData, $examId, $partNumber, null);
                $totalQuestions++;
            }
        }
    }
    
    // Update Total Questions
    $exam->total_questions = $totalQuestions;
    $exam->update(['total_questions' => $totalQuestions], ['exam_id' => $examId]);
    
    echo "Import Completed! Total Questions: $totalQuestions\n";
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

function createQuestion($qData, $examId, $partNumber, $groupId) {
    $q = new ExamQuestion();
    $q->exam_id = $examId;
    $q->group_id = $groupId;
    $q->part_number = $partNumber;
    $q->question_number = $qData['question_number'];
    $q->question_text = $qData['question_text'];
    // Encode options as JSON
    $q->options = json_encode($qData['options']);
    $q->correct_answer = $qData['correct_answer'];
    $q->explanation = $qData['explanation'] ?? null;
    
    if (!$q->save()) {
        echo "Warning: Failed to save question " . $qData['question_number'] . "\n";
    }
}
