<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Models\Exam;
use App\Models\ExamQuestionGroup;
use App\Models\ExamQuestion;

// Autoload classes
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = dirname(__DIR__) . '/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

loadEnv(dirname(__DIR__) . '/.env');

function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Paths
$dataDir = dirname(__DIR__, 2) . '/data';
$types = [
    'exam_readlis' => 'readlis',
    'exam_speaking' => 'speaking',
    'exam_writting' => 'writting'
];

$limit = isset($argv[1]) ? (int)$argv[1] : 0;
$count = 0;

foreach ($types as $folder => $type) {
    echo "Processing Type: $type (Folder: $folder)\n";
    $path = $dataDir . '/' . $folder;
    
    if (!is_dir($path)) {
        echo "Skipping $folder (Not a directory)\n";
        continue;
    }

    $subFolders = scandir($path);
    foreach ($subFolders as $sub) {
        if ($sub === '.' || $sub === '..') continue;
        
        $jsonFile = $path . '/' . $sub . '/data.json';
        if (!file_exists($jsonFile)) {
            continue;
        }

        if ($limit > 0 && $count >= $limit) {
            echo "Limit reached.\n";
            exit;
        }

        echo "Importing: $sub ...\n";
        importExam($jsonFile, $type);
        $count++;
    }
}

function importExam($jsonPath, $type) {
    $jsonData = file_get_contents($jsonPath);
    $data = json_decode($jsonData, true);
    
    if (!$data) {
        echo "  Invalid JSON: $jsonPath\n";
        return;
    }

    $title = $data['testName'] ?? $data['title'] ?? 'Unknown Exam';
    $exists = Exam::findOneBy('title', $title);
    if ($exists) {
        echo "  Exam '$title' already exists. Skipping.\n";
        return;
    }

    $exam = new Exam();
    $exam->title = $title;
    $exam->description = $data['testUrl'] ?? '';
    $exam->duration_minutes = $data['duration_minutes'] ?? match($type) {
        'readlis' => 120,
        'speaking' => 20,
        'writting' => 60,
        default => 60
    };
    $exam->type = $type;
    $exam->year = date('Y');
    $exam->audio_url = $data['audioUrl'] ?? null;
    
    if (!$exam->save()) {
        echo "  Error: Failed to save exam\n";
        return;
    }
    
    $examId = $exam->exam_id;
    $totalQuestions = 0;

    if ($type === 'readlis') {
        $totalQuestions = importReadLis($data, $examId);
    } elseif ($type === 'speaking') {
        $totalQuestions = importSpeaking($data, $examId);
    } elseif ($type === 'writting') {
        $totalQuestions = importWriting($data, $examId);
    }

    $exam->total_questions = $totalQuestions;
    $exam->save();
    
    echo "  Imported with $totalQuestions questions.\n";
}

function importReadLis($data, $examId) {
    $count = 0;
    if (!isset($data['questions']) || !is_array($data['questions'])) {
        return 0;
    }

    // Group questions by shared transcript (for Parts 3, 4, 6, 7)
    $groupedQuestions = groupByTranscript($data['questions']);
    
    foreach ($groupedQuestions as $group) {
        if (count($group) > 1 && shouldGroup($group[0])) {
            // Create question group
            $count += importQuestionGroup($group, $examId);
        } else {
            // Standalone question
            $count += importStandaloneQuestion($group[0], $examId);
        }
    }
    
    return $count;
}

function groupByTranscript($questions) {
    $grouped = [];
    $currentGroup = [];
    $currentTranscript = null;
    
    foreach ($questions as $qData) {
        $transcript = $qData['transcript'] ?? '';
        $questionNum = (int)$qData['questionNumber'];
        $partNum = inferPart($questionNum);
        
        // Only group for Parts 3, 4, 6, 7
        if (in_array($partNum, [3, 4, 6, 7]) && !empty($transcript)) {
            if ($transcript === $currentTranscript) {
                $currentGroup[] = $qData;
            } else {
                if (!empty($currentGroup)) {
                    $grouped[] = $currentGroup;
                }
                $currentGroup = [$qData];
                $currentTranscript = $transcript;
            }
        } else {
            // Parts 1, 2, 5 - no grouping
            if (!empty($currentGroup)) {
                $grouped[] = $currentGroup;
                $currentGroup = [];
                $currentTranscript = null;
            }
            $grouped[] = [$qData];
        }
    }
    
    if (!empty($currentGroup)) {
        $grouped[] = $currentGroup;
    }
    
    return $grouped;
}

function shouldGroup($qData) {
    $questionNum = (int)$qData['questionNumber'];
    $partNum = inferPart($questionNum);
    // Group only for Parts 3, 4, 6, 7
    return in_array($partNum, [3, 4, 6, 7]);
}

function importQuestionGroup($group, $examId) {
    $firstQ = $group[0];
    $questionNum = (int)$firstQ['questionNumber'];
    $partNum = inferPart($questionNum);
    
    $qGroup = new ExamQuestionGroup();
    $qGroup->exam_id = $examId;
    $qGroup->part_number = $partNum;
    
    // Use transcript as source of truth, fallback to context
    $transcript = $firstQ['transcript'] ?? '';
    $context = $firstQ['context'] ?? '';
    $qGroup->content_text = !empty($transcript) ? $transcript : $context;
    
    if (isset($firstQ['urlImage'])) {
        $qGroup->image_url = $firstQ['urlImage'];
    }
    
    $qGroup->save();
    $groupId = $qGroup->group_id;
    
    $count = 0;
    foreach ($group as $qData) {
        $q = new ExamQuestion();
        $q->exam_id = $examId;
        $q->group_id = $groupId;
        $q->question_number = $qData['questionNumber'];
        $q->part_number = $partNum;
        
        // NEVER extract from explanation - use as-is
        $q->question_text = $qData['questionText'] ?? '';
        
        // Choices
        $options = [];
        if (isset($qData['choices'])) {
            foreach ($qData['choices'] as $c) {
                $options[$c['value']] = $c['text'];
            }
        }
        $q->options = json_encode($options);
        $q->correct_answer = $qData['correctAnswer'] ?? null;
        $q->explanation = $qData['explanation'] ?? null;
        
        if (isset($qData['urlImage']) && $qData['urlImage'] !== ($firstQ['urlImage'] ?? null)) {
            $q->image_urls = json_encode([$qData['urlImage']]);
        }
        
        $q->save();
        $count++;
    }
    
    return $count;
}

function importStandaloneQuestion($qData, $examId) {
    $questionNum = (int)$qData['questionNumber'];
    $partNum = inferPart($questionNum);
    
    $q = new ExamQuestion();
    $q->exam_id = $examId;
    $q->question_number = $qData['questionNumber'];
    $q->part_number = $partNum;
    $q->question_text = $qData['questionText'] ?? '';
    
    // Choices
    $options = [];
    if (isset($qData['choices'])) {
        foreach ($qData['choices'] as $c) {
            $options[$c['value']] = $c['text'];
        }
    }
    $q->options = json_encode($options);
    $q->correct_answer = $qData['correctAnswer'] ?? null;
    $q->explanation = $qData['explanation'] ?? null;
    
    if (isset($qData['urlImage'])) {
        $q->image_urls = json_encode([$qData['urlImage']]);
    }
    
    $q->save();
    return 1;
}

function inferPart($number) {
    $num = (int)$number;
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
    if (!isset($data['questions'])) return 0;
    
    foreach ($data['questions'] as $qData) {
        $q = new ExamQuestion();
        $q->exam_id = $examId;
        $q->question_number = $qData['questionNumber'];
        $q->part_number = 1;
        $q->question_type = $qData['questionType'];
        $q->question_text = $qData['context'] ?? '';
        
        $q->image_urls = isset($qData['imageUrls']) ? json_encode($qData['imageUrls']) : null;
        $q->audio_urls = isset($qData['audioUrls']) ? json_encode($qData['audioUrls']) : null;
        
        $q->save();
        $count++;
    }
    return $count;
}

function importWriting($data, $examId) {
    $count = 0;
    if (!isset($data['questions'])) return 0;

    foreach ($data['questions'] as $qData) {
        $q = new ExamQuestion();
        $q->exam_id = $examId;
        $q->question_number = $qData['questionNumber'];
        $q->part_number = 1;
        $q->question_type = $qData['questionType'];
        
        $text = $qData['context'] ?? '';
        if (isset($qData['emailDetails'])) {
            $email = $qData['emailDetails'];
            $text .= "\n\nFrom: " . ($email['from'] ?? '') . 
                     "\nTo: " . ($email['to'] ?? '') .
                     "\nSubject: " . ($email['subject'] ?? '') . "\n" .
                     ($email['content'] ?? '');
        }
        $q->question_text = $text;
        
        $q->image_urls = isset($qData['imageUrls']) ? json_encode($qData['imageUrls']) : null;
        
        $q->save();
        $count++;
    }
    return $count;
}
