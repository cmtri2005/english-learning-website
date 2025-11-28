<?php

class Hass
{
    public static function make($password)
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }
    public static function check($password, $hashedPassword)
    {
        return password_verify($password, $hashedPassword);
    }
}
