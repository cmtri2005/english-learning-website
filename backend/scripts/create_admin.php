<?php
/**
 * Create Admin Account Script
 * 
 * Usage: 
 *   php scripts/create_admin.php
 *   php scripts/create_admin.php --email=admin@example.com --password=mypassword --name="Admin User"
 */

require dirname(__DIR__) . '/vendor/autoload.php';

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

// Load .env
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
loadEnv(dirname(__DIR__) . '/.env');

use App\Core\Hash;
use App\Helper\Database;

// Parse command line arguments
$options = getopt('', ['email::', 'password::', 'name::']);

$email = $options['email'] ?? 'admin@monolingo.com';
$password = $options['password'] ?? 'admin123';
$name = $options['name'] ?? 'Admin';

echo "=== Create Admin Account ===\n\n";

try {
    $pdo = Database::getInstance();
    
    // Check if account exists
    $stmt = $pdo->prepare("SELECT * FROM accounts WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $existing = $stmt->fetch(\PDO::FETCH_ASSOC);
    
    if ($existing) {
        echo "Account with email '{$email}' already exists.\n";
        echo "User ID: {$existing['user_id']}\n";
        echo "Role: {$existing['role']}\n";
        
        if ($existing['role'] !== 'admin') {
            $stmt = $pdo->prepare("UPDATE accounts SET role = 'admin' WHERE user_id = :id");
            $stmt->execute([':id' => $existing['user_id']]);
            echo "\n✓ Account upgraded to admin role.\n";
        } else {
            echo "✓ Account is already an admin.\n";
        }
    } else {
        $hashedPassword = Hash::make($password);
        
        $stmt = $pdo->prepare("
            INSERT INTO accounts (name, email, password, role, rating, verify_email_token, created_at, updated_at)
            VALUES (:name, :email, :password, 'admin', 0, NULL, NOW(), NOW())
        ");
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':password' => $hashedPassword
        ]);
        
        echo "✓ Admin account created successfully!\n\n";
        echo "Email: {$email}\n";
        echo "Password: {$password}\n";
        echo "Name: {$name}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\nDone.\n";


