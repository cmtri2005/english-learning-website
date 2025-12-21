<?php

namespace App\Services;

class ExamScoringService
{
    /**
     * Calculate score based on user answers
     * 
     * @param array $questions List of Question objects/arrays with 'correct_answer' and 'part_number'
     * @param array $userAnswers Associative array of [question_id => selected_option]
     * @return array Result containing scores and details
     */
    public function calculateScore(array $questions, array $userAnswers)
    {
        $listeningCorrect = 0;
        $readingCorrect = 0;
        $totalListening = 0;
        $totalReading = 0;

        $questionMap = [];
        foreach ($questions as $q) {
            // Normalize object/array access
            $qId = is_object($q) ? $q->question_id : $q['question_id'];
            $part = is_object($q) ? $q->part_number : $q['part_number'];
            $correct = is_object($q) ? $q->correct_answer : $q['correct_answer'];

            $questionMap[$qId] = [
                'part' => $part,
                'correct' => $correct
            ];

            if ($part <= 4) {
                $totalListening++;
            } else {
                $totalReading++;
            }
        }

        $details = [];

        foreach ($userAnswers as $qId => $selectedOption) {
            if (!isset($questionMap[$qId])) {
                continue;
            }

            $qData = $questionMap[$qId];
            $correctAnswer = $qData['correct'];
            
            // If no correct answer defined (Speaking/Writing), currently mark false (or skipped).
            // Prevent crash on null
            if ($correctAnswer === null) {
                $isCorrect = false;
            } else {
                $isCorrect = (strcasecmp((string)trim($selectedOption), (string)$correctAnswer) === 0);
            }

            if ($isCorrect) {
                if ($qData['part'] <= 4) {
                    $listeningCorrect++;
                } else {
                    $readingCorrect++;
                }
            }

            $details[] = [
                'question_id' => $qId,
                'selected_option' => $selectedOption,
                'is_correct' => $isCorrect
            ];
        }

        // Scoring Logic: Simple Multiplier (Temporary)
        // TOEIC MAX 990 (495 L + 495 R)
        // This is a rough approximation. Real TOEIC uses a conversion table.

        $scoreListening = min(495, $listeningCorrect * 5);
        $scoreReading = min(495, $readingCorrect * 5);

        // Adjust if total parts are small (e.g. mini test)
        // If it's a full test (100 Qs each), * 5 is roughly correct (100 * 5 = 500 ~ 495).

        return [
            'listening_score' => $scoreListening,
            'reading_score' => $scoreReading,
            'total_score' => $scoreListening + $scoreReading,
            'listening_correct_count' => $listeningCorrect,
            'reading_correct_count' => $readingCorrect,
            'details' => $details
        ];
    }
}
