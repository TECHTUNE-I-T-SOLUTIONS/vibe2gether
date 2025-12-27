-- ============================================================
-- FIX TRIGGER CONFLICT
-- ============================================================
-- DROP the problematic trig_post_flagged trigger that references non-existent is_flagged field
DROP TRIGGER IF EXISTS trig_post_flagged ON posts;

-- Also drop the broken trigger_post_flagged function if it exists
DROP FUNCTION IF EXISTS trigger_post_flagged();

-- ============================================================
-- VERIFY COUNT UPDATE TRIGGERS ARE CORRECT
-- ============================================================
-- These should already exist from 012_create_count_update_triggers.sql
-- Verify they work with simple UPDATE statements on posts table

-- Test trigger: This should safely update likes_count without triggering trig_post_flagged
-- (Not an actual command, just documentation)
-- Example: UPDATE posts SET likes_count = likes_count + 1 WHERE id = '<post-id>';
