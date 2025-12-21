<?php

namespace App\Models;

use App\Core\Model;

class ExamAttempt extends Model
{
    protected static $table = 'exam_attempts';
    protected static $primaryKey = 'attempt_id';

    public $attempt_id;
    public $user_id;
    public $exam_id;
    public $start_time;
    public $end_time;
    public $score_listening;
    public $score_reading;
    public $total_score;
    public $status;
}
