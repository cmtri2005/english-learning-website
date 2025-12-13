<?php

namespace App\Core;

use PDO;
use App\Helper\Database;

abstract class Model implements Model_Interface
{
    protected static function db(): PDO
    {
        return Database::getInstance(); //Singleton database connection
    }

    protected static $table;
    protected static $primaryKey = 'id';

    public function save()
    {
        // 1. Get primary key và convert object -> array.
        $primaryKey = static::$primaryKey;
        $data = $this->toArray();

        // 2. Loại bỏ null value
        $data = array_filter($data, function ($value) {
            return $value !== null;
        });

        // 3. Xác định INSERT hay UPDATE
        $isUpdate = isset($this->$primaryKey) && !empty($this->$primaryKey);

        if ($isUpdate) {
            // Update
            $id = $this->$primaryKey;

            unset($data[$primaryKey]);
            if (empty($data)) {
                return true; 
            }

            $setClause = [];
            foreach (array_keys($data) as $column) {
                $setClause[] = "{$column} = :{$column}";
            }
            $setClause = implode(',', $setClause);

            $query = "UPDATE " . static::$table . " SET {$setClause} WHERE " . $primaryKey . " = :id";
            $stmt = self::db()->prepare($query);

            $stmt->bindParam(':id', $id);
            foreach ($data as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }

            return $stmt->execute();
        } else {
            // Insert 
            if (isset($data[$primaryKey]) && empty($data[$primaryKey])) {
                unset($data[$primaryKey]);
            }

            if (empty($data)) {
                return false;
            }

            $columns = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));

            $query = "INSERT INTO " . static::$table . " ({$columns}) VALUES ({$placeholders})";
            $stmt = self::db()->prepare($query);

            foreach ($data as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            if ($stmt->execute()) {
                // Set the primary key value for the current instance
                $insertId = self::db()->lastInsertId();
                if ($insertId) {
                    $this->$primaryKey = $insertId;
                }
                return true;
            }

            return false;
        }
    }

    // Get all records
    public static function all($orderBy = null, $direction = 'ASC')
    {
        $query = "SELECT * FROM " . static::$table;

        if ($orderBy) {
            $query .= " ORDER BY {$orderBy} {$direction}";
        }

        $stmt = self::db()->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_CLASS, static::class);
    }

    // Find record by primary key
    public static function find($id)
    {
        $query = "SELECT * FROM " . static::$table . " WHERE " . static::$primaryKey . " = :id LIMIT 1";
        $stmt = self::db()->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->setFetchMode(PDO::FETCH_CLASS, static::class);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    // Find records by field
    public static function findBy($field, $value)
    {
        $query = "SELECT * FROM " . static::$table . " WHERE {$field} = :value";
        $stmt = self::db()->prepare($query);
        $stmt->bindParam(':value', $value);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_CLASS, static::class);
    }

    // Find record by field
    public static function findOneBy($field, $value)
    {
        $query = "SELECT * FROM " . static::$table . " WHERE {$field} = :value LIMIT 1";
        $stmt = self::db()->prepare($query);
        $stmt->bindParam(':value', $value);
        $stmt->execute();
        $stmt->setFetchMode(PDO::FETCH_CLASS, static::class);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public static function findOneWhere(array $conditions)
    {
        $table = static::$table;
        $whereClause = [];
        $params = [];

        foreach ($conditions as $column => $value) {
            $whereClause[] = "$column = :$column";
            $params[":$column"] = $value;
        }

        $whereSql = implode(' AND ', $whereClause);
        $query = "SELECT * FROM $table WHERE $whereSql LIMIT 1";

        $stmt = self::db()->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        $stmt->setFetchMode(PDO::FETCH_CLASS, static::class);
        $result = $stmt->fetch();

        return $result ?: null;
    }


    public static function create(array $data)
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));

        $query = "INSERT INTO " . static::$table . " ({$columns}) VALUES ({$placeholders})";
        $stmt = self::db()->prepare($query);

        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        if ($stmt->execute()) {
            $id = self::db()->lastInsertId();
            return static::find($id);
        }

        return false;
    }


    public static function update($id, array $data)
    {
        $setClause = [];
        foreach (array_keys($data) as $column) {
            $setClause[] = "{$column} = :{$column}";
        }
        $setClause = implode(', ', $setClause);


        $query = "UPDATE " . static::$table . " SET {$setClause} WHERE " . static::$primaryKey . " = :id";
        $stmt = self::db()->prepare($query);

        $stmt->bindParam(':id', $id);
        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        return $stmt->execute();
    }


    public static function delete($id)
    {
        $query = "DELETE FROM " . static::$table . " WHERE " . static::$primaryKey . " = :id";
        $stmt = self::db()->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public static function query($query, $params = [], $fetchMode = PDO::FETCH_CLASS)
    {
        try {

            $stmt = self::db()->prepare($query);

            foreach ($params as $key => $value) {
                $stmt->bindValue(is_numeric($key) ? $key + 1 : ":{$key}", $value);
            }

            $stmt->execute();

            if ($fetchMode === PDO::FETCH_CLASS) {
                $results = $stmt->fetchAll(PDO::FETCH_CLASS, static::class);
                return $results;
            }

            return $stmt->fetchAll($fetchMode);
        } catch (\Throwable $th) {
            throw $th;
        }
    }

    public static function findWhere(array $conditions, $operator = 'AND')
    {
        if (empty($conditions)) {
            return self::all();
        }

        $query = "SELECT * FROM " . static::$table . " WHERE ";
        $whereConditions = [];
        $params = [];

        foreach ($conditions as $field => $value) {
            if ($value === null) {
                $whereConditions[] = "{$field} IS NULL";
            } else {
                $whereConditions[] = "{$field} = :{$field}";
                $params[$field] = $value;
            }
        }

        $query .= implode(" {$operator} ", $whereConditions);

        $stmt = self::db()->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_CLASS, static::class);
    }


    public static function findWhereAdvanced(array $conditions, $operator = 'AND')
    {
        if (empty($conditions)) {
            return self::all();
        }

        $query = "SELECT * FROM " . static::$table . " WHERE ";
        $whereConditions = [];
        $params = [];
        $paramIndex = 0;

        foreach ($conditions as $condition) {
            if (count($condition) < 3) {
                continue;
            }

            list($field, $compOperator, $value) = $condition;
            $paramName = "param" . $paramIndex++;

            if ($value === null && ($compOperator === '=' || $compOperator === '!=')) {
                $whereConditions[] = "{$field} " . ($compOperator === '=' ? 'IS NULL' : 'IS NOT NULL');
            } else {
                $whereConditions[] = "{$field} {$compOperator} :{$paramName}";
                $params[$paramName] = $value;
            }
        }

        $query .= implode(" {$operator} ", $whereConditions);

        $stmt = self::db()->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_CLASS, static::class);
    }


    public static function paginate($page = 1, $perPage = 10, $orderBy = null, $direction = 'ASC')
    {
        // Đảm bảo page và perPage là số nguyên dương
        $page = max(1, (int) $page);
        $perPage = max(1, (int) $perPage);

        // Đếm tổng số bản ghi
        $countQuery = "SELECT COUNT(*) FROM " . static::$table;
        $countStmt = self::db()->prepare($countQuery);
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Tính toán offset và trang cuối cùng
        $offset = ($page - 1) * $perPage;
        $lastPage = ceil($total / $perPage);

        // Truy vấn dữ liệu cho trang hiện tại
        $query = "SELECT * FROM " . static::$table;

        if ($orderBy) {
            $query .= " ORDER BY {$orderBy} {$direction}";
        }

        $query .= " LIMIT :limit OFFSET :offset";

        $stmt = self::db()->prepare($query);
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_CLASS, static::class);

        return [
            'data' => $data,
            'total' => $total,
            'current_page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
            'from' => $offset + 1,
            'to' => min($offset + $perPage, $total)
        ];
    }

    public static function paginateWhere(array $conditions, $page = 1, $perPage = 10, $operator = 'AND', $orderBy = null, $direction = 'ASC')
    {
        // Đảm bảo page và perPage là số nguyên dương
        $page = max(1, (int) $page);
        $perPage = max(1, (int) $perPage);

        // Xây dựng phần WHERE của truy vấn
        $whereClause = "";
        $params = [];

        if (!empty($conditions)) {
            $whereConditions = [];

            foreach ($conditions as $field => $value) {
                if ($value === null) {
                    $whereConditions[] = "{$field} IS NULL";
                } else {
                    if (isset($value['operator']) && isset($value['value'])) {
                        $whereConditions[] = "{$field} {$value['operator']} :{$field}";
                        $params[$field] = $value['value'];
                    } else {
                        $whereConditions[] = "{$field} = :{$field}";
                        $params[$field] = $value;
                    }
                }
            }

            $whereClause = " WHERE " . implode(" {$operator} ", $whereConditions);
        }

        // Đếm tổng số bản ghi thỏa mãn điều kiện
        $countQuery = "SELECT COUNT(*) FROM " . static::$table . $whereClause;
        $countStmt = self::db()->prepare($countQuery);

        foreach ($params as $key => $value) {
            $countStmt->bindValue(":{$key}", $value);
        }

        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Tính toán offset và trang cuối cùng
        $offset = ($page - 1) * $perPage;
        $lastPage = ceil($total / $perPage);

        // Truy vấn dữ liệu cho trang hiện tại
        $query = "SELECT * FROM " . static::$table . $whereClause;

        if ($orderBy) {
            $query .= " ORDER BY {$orderBy} {$direction}";
        }

        $query .= " LIMIT :limit OFFSET :offset";

        $stmt = self::db()->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_CLASS, static::class);

        return [
            'data' => $data,
            'total' => $total,
            'current_page' => $page,
            'total_pages' => ceil($total / $perPage), // Thay thế 'last_page' bằng 'total_pages'
            'per_page' => $perPage,
            'last_page' => $lastPage,
            'from' => $offset + 1,
            'to' => min($offset + $perPage, $total)
        ];
    }

    /**
     * Lấy tên khóa chính của model
     * 
     * @return string|array
     */
    public static function getPrimaryKey()
    {
        return static::$primaryKey;
    }

    /**
     * Lấy tên bảng của model
     * 
     * @return string
     */
    public static function getTable()
    {
        return static::$table;
    }

    public function toArray()
    {
        $properties = get_object_vars($this);
        return $properties;
    }

}
