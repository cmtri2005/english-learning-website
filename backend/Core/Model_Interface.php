<?php

namespace App\Core;

interface Model_Interface
{
    /*
    Get table name
    */
    public static function getTable();
    /*
    Get primary key
    */
    public static function getPrimaryKey();

    public static function findBy($field, $value);
    public static function findOneBy($field, $value);
}
