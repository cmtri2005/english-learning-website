<?php

namespace App\Models;

use App\Core\Model;

class ExamQuestionGroup extends Model
{
    protected static $table = 'exam_question_groups';
    protected static $primaryKey = 'group_id';

    public $group_id;
    public $exam_id;
    public $part_number;
    public $content_text;
    public $image_url;
    public $audio_url;
    public $transcript;
}
