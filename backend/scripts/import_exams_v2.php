<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamQuestionGroup;

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = dirname(__DIR__) . '/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

loadEnv(dirname(__DIR__) . '/.env');

function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (!str_contains($line, '=')) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(sprintf('%s=%s', trim($name), trim($value)));
        $_ENV[trim($name)] = trim($value);
    }
}

// Support both Docker (/data) and local development paths
$dataDir = is_dir('/data') ? '/data' : dirname(__DIR__, 2) . '/data';
$types = [
    'exam_readlis' => 'readlis',
    'exam_speaking' => 'speaking',
    'exam_writting' => 'writting'
];

$limit = isset($argv[1]) ? (int)$argv[1] : 0;
$count = 0;

foreach ($types as $folder => $type) {
    echo "Processing: $type\n";
    $path = $dataDir . '/' . $folder;
    if (!is_dir($path)) continue;

    foreach (scandir($path) as $sub) {
        if ($sub === '.' || $sub === '..') continue;
        $jsonFile = $path . '/' . $sub . '/data.json';
        if (!file_exists($jsonFile)) continue;
        if ($limit > 0 && $count >= $limit) exit;

        echo "  Importing: $sub\n";
        importExam($jsonFile, $type);
        $count++;
    }
}

echo "\nCompleted: $count exams imported.\n";

function importExam($jsonPath, $type) {
    $data = json_decode(file_get_contents($jsonPath), true);
    if (!$data) return;

    $title = $data['testName'] ?? 'Unknown';
    if (Exam::findOneBy('title', $title)) {
        echo "    Exists, skipping.\n";
        return;
    }

    $exam = new Exam();
    $exam->title = $title;
    $exam->description = '';
    $exam->duration_minutes = match($type) {
        'readlis' => 120,
        'speaking' => 20,
        'writting' => 60,
        default => 60
    };
    $exam->type = $type;
    $exam->year = date('Y');
    $exam->audio_url = $data['audioUrl'] ?? null;
    
    if (!$exam->save()) return;

    $totalQ = match($type) {
        'readlis' => importReadLis($data, $exam->exam_id),
        'speaking' => importSpeaking($data, $exam->exam_id),
        'writting' => importWriting($data, $exam->exam_id),
        default => 0
    };

    $exam->total_questions = $totalQ;
    $exam->save();
    echo "    ✓ $totalQ questions\n";
}

function importReadLis($data, $examId) {
    $count = 0;
    $questions = $data['questions'] ?? [];
    
    // Group questions by part and shared context/transcript
    $grouped = [];
    foreach ($questions as $qData) {
        $partNum = inferPart($qData['questionNumber']);
        $qData['_partNum'] = $partNum;
        
        // Determine grouping key
        if (in_array($partNum, [3, 4])) {
            // Part 3-4: Group by transcript (conversation/talk)
            $groupKey = md5($qData['transcript'] ?? '');
        } elseif (in_array($partNum, [6, 7])) {
            // Part 6-7: Group by context (passage/email)
            $groupKey = md5($qData['context'] ?? '');
        } else {
            // Part 1, 2, 5: No grouping
            $groupKey = 'standalone_' . $qData['questionNumber'];
        }
        
        if (!isset($grouped[$partNum])) {
            $grouped[$partNum] = [];
        }
        if (!isset($grouped[$partNum][$groupKey])) {
            $grouped[$partNum][$groupKey] = [];
        }
        $grouped[$partNum][$groupKey][] = $qData;
    }
    
    // Import grouped questions
    foreach ($grouped as $partNum => $groups) {
        foreach ($groups as $groupKey => $groupQuestions) {
            $groupSize = count($groupQuestions);
            
            // Debug: Show grouping info for Part 6-7
            if (in_array($partNum, [6, 7]) && $groupSize > 1) {
                echo "    Part $partNum: Grouping " . $groupSize . " questions (Q" . $groupQuestions[0]['questionNumber'] . "-Q" . $groupQuestions[$groupSize-1]['questionNumber'] . ")\n";
            }
            
            if ($groupSize > 1 && in_array($partNum, [3, 4, 6, 7])) {
                // Create question group using raw SQL to ensure content_text is saved
                $firstQ = $groupQuestions[0];
                
                // Determine content_text based on part
                if (in_array($partNum, [3, 4])) {
                    // Part 3-4: No text content during exam (only audio + questions)
                    $contentText = '';
                    $transcript = $firstQ['transcript'] ?? '';
                } else {
                    // Part 6-7: Use context as content_text (the passage/email)
                    // Fallback to transcript if context is not available (some JSON files don't have context field)
                    $contextValue = $firstQ['context'] ?? '';
                    $transcriptValue = $firstQ['transcript'] ?? '';
                    
                    // Use context if available, otherwise use transcript
                    $contentText = !empty($contextValue) ? $contextValue : $transcriptValue;
                    $transcript = $transcriptValue;
                }
                
                $imageUrl = $firstQ['urlImage'] ?? null;
                
                // Use raw SQL INSERT to ensure content_text is saved
                $pdo = \App\Helper\Database::getInstance();
                $stmt = $pdo->prepare("
                    INSERT INTO exam_question_groups 
                    (exam_id, part_number, content_text, image_url, audio_url, transcript) 
                    VALUES (:exam_id, :part_number, :content_text, :image_url, :audio_url, :transcript)
                ");
                $stmt->execute([
                    ':exam_id' => $examId,
                    ':part_number' => $partNum,
                    ':content_text' => $contentText,
                    ':image_url' => $imageUrl,
                    ':audio_url' => null,
                    ':transcript' => $transcript
                ]);
                $groupId = $pdo->lastInsertId();
                
                // Debug: Verify content_text was saved (Part 6 only)
                if ($partNum == 6) {
                    $checkStmt = $pdo->prepare("SELECT LENGTH(content_text) as len FROM exam_question_groups WHERE group_id = ?");
                    $checkStmt->execute([$groupId]);
                    $check = $checkStmt->fetch(\PDO::FETCH_ASSOC);
                    echo "      [DEBUG] Saved Part 6 group_id=$groupId, content_text length: " . ($check['len'] ?? 0) . " chars\n";
                }
                
                // Import questions in this group
                foreach ($groupQuestions as $qData) {
                    $count += importQuestion($qData, $examId, $groupId);
                }
            } else {
                // Standalone question
                foreach ($groupQuestions as $qData) {
                    $count += importQuestion($qData, $examId, null);
                }
            }
        }
    }
    
    return $count;
}

function importQuestion($qData, $examId, $groupId = null) {
    $q = new ExamQuestion();
    $q->exam_id = $examId;
    $q->group_id = $groupId;
    $q->question_number = $qData['questionNumber'];
    $partNum = $qData['_partNum'];
    $q->part_number = $partNum;
    
    // For grouped questions (Part 3-4, 6-7), question_text should be the individual question
    // For Part 6 in a group, leave empty (passage has blanks inline)
    // For Part 7 in a group, use part7_question field for the individual question text
    if ($groupId && $partNum == 6) {
        // Part 6: No individual question text (blanks are in the passage)
        $q->question_text = '';
    } elseif ($groupId && $partNum == 7) {
        // Part 7: Use part7_question for individual question text (e.g., "What is the purpose of the email?")
        $q->question_text = $qData['part7_question'] ?? '';
    } elseif ($groupId && in_array($partNum, [3, 4])) {
        // Part 3-4: Use context as the individual question (e.g., "What does the man suggest?")
        $q->question_text = $qData['context'] ?? '';
    } else {
        // Part 1, 2, 5 or standalone: Use context as question_text
        $q->question_text = $qData['context'] ?? $qData['questionText'] ?? '';
    }
    
    // Options
    $options = [];
    if (isset($qData['choices'])) {
        foreach ($qData['choices'] as $c) {
            if ($partNum <= 4) {
                // Parts 1-4 (Listening): Just show "A", "B", "C", "D"
                $options[] = $c['value'] ?? '';
            } else {
                // Parts 5-7 (Reading): Show full text
                $text = $c['text'] ?? '';
                $cleanText = trim(str_replace('.', '', $text));
                if (strlen($cleanText) <= 1) {
                    $options[] = $c['value'] ?? '';
                } else {
                    $options[] = $text;
                }
            }
        }
    }
    $q->options = json_encode($options);
    
    $q->correct_answer = $qData['correctAnswer'] ?? null;
    $q->explanation = $qData['explanation'] ?? null;
    
    if (!empty($qData['urlImage'])) {
        $q->image_urls = json_encode([$qData['urlImage']]);
    }
    
    $q->save();
    return 1;
}

function inferPart($num) {
    $num = (int)$num;
    if ($num <= 6) return 1;
    if ($num <= 31) return 2;
    if ($num <= 69) return 3;
    if ($num <= 100) return 4;
    if ($num <= 130) return 5;
    if ($num <= 146) return 6;
    return 7;
}

function importSpeaking($data, $examId) {
    $count = 0;
    foreach ($data['questions'] ?? [] as $qData) {
        $q = new ExamQuestion();
        $q->exam_id = $examId;
        $q->question_number = $qData['questionNumber'];
        $q->part_number = 1;
        $q->question_type = $qData['questionType'] ?? null;
        $q->question_text = $qData['context'] ?? '';
        
        if (!empty($qData['imageUrls'])) {
            $q->image_urls = json_encode($qData['imageUrls']);
        }
        if (!empty($qData['audioUrls'])) {
            $q->audio_urls = json_encode($qData['audioUrls']);
        }
        
        $q->save();
        $count++;
    }
    return $count;
}

function importWriting($data, $examId) {
    $count = 0;
    foreach ($data['questions'] ?? [] as $qData) {
        $q = new ExamQuestion();
        $q->exam_id = $examId;
        $q->question_number = $qData['questionNumber'];
        $q->part_number = 1;
        $q->question_type = $qData['questionType'] ?? null;
        
        $text = $qData['context'] ?? '';
        if (!empty($qData['emailDetails'])) {
            $email = $qData['emailDetails'];
            $text .= "\n\nFrom: " . ($email['from'] ?? '');
            $text .= "\nTo: " . ($email['to'] ?? '');
            $text .= "\nSubject: " . ($email['subject'] ?? '');
            $text .= "\n\n" . ($email['content'] ?? '');
        }
        $q->question_text = $text;
        
        if (!empty($qData['imageUrls'])) {
            $q->image_urls = json_encode($qData['imageUrls']);
        }
        
        $q->save();
        $count++;
    }
    return $count;
}
