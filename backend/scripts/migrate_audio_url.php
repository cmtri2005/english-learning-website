<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Helper\Database;

// Autoload classes
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
        list($name, $value) = explode('=', $line, 2);
        putenv(sprintf('%s=%s', trim($name), trim($value)));
        $_ENV[trim($name)] = trim($value);
    }
}

try {
    $db = Database::getInstance();
    
    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM `exams` LIKE 'audio_url'");
    if ($stmt->rowCount() == 0) {
        echo "Adding audio_url to exams table...\n";
        $db->exec("ALTER TABLE `exams` ADD COLUMN `audio_url` VARCHAR(255) AFTER `year`");
        echo "Column added successfully.\n";
    } else {
        echo "Column audio_url already exists.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
