<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Helper\Database;

// Autoload classes (replicated from index.php)
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

// Initialize Environment
// $dotenv = Dotenv::createImmutable(dirname(__DIR__));
// $dotenv->load();
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

$db = Database::getInstance();
$conn = $db->getConnection();

echo "Running migrations...\n";

// 1. Add 'type' to 'exams' table
try {
    // Check if column exists (MySQL specific, generic safe-ish way)
    $conn->exec("ALTER TABLE exams ADD COLUMN type VARCHAR(20) DEFAULT 'readlis' AFTER duration_minutes");
    echo "Added 'type' column to 'exams' table.\n";
} catch (PDOException $e) {
    echo "Skipped 'exams' update (might already exist): " . $e->getMessage() . "\n";
}

// 2. Add 'question_type', 'image_urls', 'audio_urls' to 'exam_questions'
try {
    $conn->exec("ALTER TABLE exam_questions ADD COLUMN question_type VARCHAR(50) DEFAULT NULL AFTER explanation");
    echo "Added 'question_type' to 'exam_questions'.\n";
} catch (PDOException $e) { echo "Skipped question_type: " . $e->getMessage() . "\n"; }

try {
    $conn->exec("ALTER TABLE exam_questions ADD COLUMN image_urls JSON DEFAULT NULL AFTER question_type");
    echo "Added 'image_urls' to 'exam_questions'.\n";
} catch (PDOException $e) { echo "Skipped image_urls: " . $e->getMessage() . "\n"; }

try {
    $conn->exec("ALTER TABLE exam_questions ADD COLUMN audio_urls JSON DEFAULT NULL AFTER image_urls");
    echo "Added 'audio_urls' to 'exam_questions'.\n";
} catch (PDOException $e) { echo "Skipped audio_urls: " . $e->getMessage() . "\n"; }

// 3. Make options and correct_answer nullable (if not already)
// Note: MODIFY COLUMN syntax varies, assuming MySQL
try {
    $conn->exec("ALTER TABLE exam_questions MODIFY COLUMN options JSON NULL");
    $conn->exec("ALTER TABLE exam_questions MODIFY COLUMN correct_answer VARCHAR(10) NULL");
    echo "Updated 'options' and 'correct_answer' to be nullable.\n";
} catch (PDOException $e) {
    echo "Skipped modifying columns: " . $e->getMessage() . "\n";
}

echo "Migration finished.\n";
