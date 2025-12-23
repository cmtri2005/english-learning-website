-- Add 'pending' status to blogs table for approval workflow
-- This migration adds the 'pending' status option between 'draft' and 'published'

USE `app_db`;

-- MySQL requires recreating the ENUM to add a new value
ALTER TABLE `blogs` 
MODIFY COLUMN `status` ENUM('draft', 'pending', 'published', 'archived') DEFAULT 'draft';
