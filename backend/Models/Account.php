<?php

namespace App\Models;

use App\Core\Hash;
use App\Core\Model;
use App\Core\UserRole;
use Exception;

class Account extends Model
{
    // Define the table for this model
    protected static $table = 'accounts';

    protected static $primaryKey = 'user_id';

    public $user_id;
    public $name;
    public $email;
    public $password;
    public $phone;
    public $address;
    public $role;
    public $points;
    public $ranking;
    public $verify_email_token;
    public $verify_token_expires_at;
    public $rating;
    public $reset_password_token;
    public $reset_password_expires_at;
    public $avatar;
    public $created_at;
    public $updated_at;

    public static function findByRole($role)
    {
        return self::findOneBy('role', $role);
    }

    public static function findOrCreateAdmin()
    {
        $admin = self::findByRole(UserRole::ADMIN);

        if (!isset($admin)) {
            $admin = self::create([
                'name' => 'Admin',
                'email' => 'admin@monolingo.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'verify_email_token' => null,
                'reset_password_token' => null,
                'reset_password_expires_at' => null,
                'rating' => 0
            ]);
        }
        return $admin;
    }

    public static function findByResetToken($token)
    {
        return self::findOneBy('reset_password_token', $token);
    }

    public function updateResetPasswordToken($token, $expiry)
    {
        $sql = "UPDATE " . static::$table . "
                SET reset_password_token = :token, reset_password_expires_at = :expiry
                WHERE " . static::$primaryKey . " = :user_id";

        $DB = PDO();
        $stmt = $DB->prepare($sql);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expiry', $expiry);
        $stmt->bindParam(':user_id', $this->{static::$primaryKey});

        return $stmt->execute();
    }

    public function updatePassword($hashedPassword)
    {
        $sql = "UPDATE " . static::$table . "
                SET password = :password
                WHERE " . static::$primaryKey . " = :user_id";
        $DB = PDO();
        $stmt = $DB->prepare($sql);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':user_id', $this->{static::$primaryKey});
        return $stmt->execute();
    }

    public function clearResetPasswordToken()
    {
        $sql = "UPDATE " . static::$table . "
                SET reset_password_token = NULL, reset_password_expires_at = NULL
                WHERE " . static::$primaryKey . " = :user_id";
        $DB = PDO();
        $stmt = $DB->prepare($sql);
        $stmt->bindParam(':user_id', $this->{static::$primaryKey});
        return $stmt->execute();
    }

    public function getRank($rank)
    {
        $ranks = [
            'Bronze' => 0,
            'Silver' => 1000,
            'Gold' => 5000,
            'Diamond' => 10000,
        ];
        return $ranks[$rank];
    }


}

