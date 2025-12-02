<?php
/**
 * Helper script to generate bcrypt password hash for SQL insert
 * 
 * Usage: php generate_password_hash.php [password]
 * Example: php generate_password_hash.php password123
 */

$password = $argv[1] ?? 'password123';

$hash = password_hash($password, PASSWORD_BCRYPT);

echo "Password: {$password}\n";
echo "Hash: {$hash}\n";
echo "\nSQL INSERT format:\n";
echo "'{$hash}'\n";

