<?php

namespace App\Helper;

use PDO;
use PDOException;
use Exception;


class Database
{
    private static ?Database $instance = null;
    private ?PDO $conn = null;

    private function __construct()
    {
        $host = getenv("DB_HOST") ?: $_ENV['DB_HOST'] ?? 'localhost';
        $port = getenv("DB_PORT") ?: $_ENV['DB_PORT'] ?? '3306';
        $dbName = getenv("DB_NAME") ?: $_ENV['DB_NAME'] ?? '';
        $user = getenv("DB_USER") ?: $_ENV['DB_USER'] ?? 'root';
        $password = getenv("DB_PASSWORD") ?: $_ENV['DB_PASSWORD'] ?? '';
        $charset = "utf8mb4";

        $dsn = "mysql:host=$host;port=$port;dbname=$dbName;charset=$charset";

        try {
            $this->conn = new PDO($dsn, $user, $password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            error_log("DSN: $dsn");
            error_log("User: $user");
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance->conn;
    }
}


