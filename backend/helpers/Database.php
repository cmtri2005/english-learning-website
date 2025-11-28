<?php

class Database
{
    private static $instance = null;
    private $conn;

    private function __construct()
    {
        $host = getenv("DB_HOST");
        $port = getenv("DB_PORT");
        $db_name = getenv("DB_NAME");
        $user = getenv("DB_USER");
        $password = getenv("DB_PASSWORD");
        $charset = "utf8mb4";

        $dsn = "mysql:host=$host;port=$port;dbname=$db_name;charset=$charset";

        try {
            $this->conn = new PDO($dsn, $user, $password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }

        return self::$instance->conn;
    }
}
