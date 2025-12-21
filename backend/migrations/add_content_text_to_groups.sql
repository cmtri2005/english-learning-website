-- Add content_text column to exam_question_groups if it doesn't exist
ALTER TABLE exam_question_groups 
ADD COLUMN IF NOT EXISTS content_text TEXT AFTER part_number;

-- Verify the change
DESCRIBE exam_question_groups;
