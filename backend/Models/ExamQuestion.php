<?php

namespace App\Models;

use App\Core\Model;

class ExamQuestion extends Model
{
    protected static $table = 'exam_questions';
    protected static $primaryKey = 'question_id';

    public $question_id;
    public $exam_id;
    public $group_id;
    public $part_number;
    public $question_number;
    public $question_text;
    public $options;
    public $correct_answer;
    public $explanation;
    
    // New fields for Speaking/Writing
    public $question_type; 
    public $image_urls; // JSON
    public $audio_urls; // JSON

    public function getOptions()
    {
        return json_decode($this->options, true) ?: [];
    }
    
    public function getImageUrls()
    {
        return json_decode($this->image_urls, true) ?: [];
    }
    
    public function getAudioUrls()
    {
        return json_decode($this->audio_urls, true) ?: [];
    }
}
