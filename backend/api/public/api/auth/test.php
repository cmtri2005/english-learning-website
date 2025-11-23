<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

echo json_encode([
    'test' => 'OK',
    'dir' => __DIR__,
    'file' => __FILE__,
    'helper_path' => __DIR__ . '/../../../helpers/Auth.php',
    'helper_exists' => file_exists(__DIR__ . '/../../../helpers/Auth.php')
]);
