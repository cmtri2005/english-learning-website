<?php

namespace App\Models;

use App\Core\Model;

class ExamAttemptAnswer extends Model
{
    protected static $table = 'exam_attempt_answers';
    protected static $primaryKey = 'answer_id';

    public $answer_id;
    public $attempt_id;
    public $question_id;
    public $selected_option;
    public $is_correct;
}
