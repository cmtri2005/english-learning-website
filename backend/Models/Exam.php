<?php

namespace App\Models;

use App\Core\Model;

class Exam extends Model
{
    protected static $table = 'exams';
    protected static $primaryKey = 'exam_id';

    public $exam_id;
    public $title;
    public $description;
    public $duration_minutes;
    public $total_questions;
    public $year;
    public $type; // 'readlis', 'speaking', 'writting'
    public $audio_url;
    public $created_at;
    public $updated_at;
}
