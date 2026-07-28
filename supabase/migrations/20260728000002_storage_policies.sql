-- Migration: Storage policies for ticket-uploads bucket
-- Description: Configures RLS policies for private ticket file storage
-- Author: Ticket Fútbol PWA Team
-- Date: 2026-07-28

-- ============================================================================
-- STORAGE BUCKET POLICIES
-- ============================================================================

-- Note: The bucket 'ticket-uploads' is configured in config.toml
-- This migration sets up the RLS policies for that bucket

-- Expected path structure: {user_id}/{ticket_id}/{filename}
-- Example: 550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/screenshot.jpg

-- ============================================================================
-- POLICY: SELECT (Download/View files)
-- ============================================================================

CREATE POLICY "Users can view their own ticket files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'ticket-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY: INSERT (Upload files)
-- ============================================================================

CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'ticket-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY: UPDATE (Rename or modify file metadata)
-- ============================================================================

CREATE POLICY "Users can update their own ticket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'ticket-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'ticket-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY: DELETE (Remove files)
-- ============================================================================

CREATE POLICY "Users can delete their own ticket files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'ticket-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view their own ticket files" ON storage.objects IS 
'Allows users to download/view only files in their own user folder within ticket-uploads bucket';

COMMENT ON POLICY "Users can upload files to their own folder" ON storage.objects IS 
'Allows users to upload files only to their own user folder within ticket-uploads bucket';

COMMENT ON POLICY "Users can update their own ticket files" ON storage.objects IS 
'Allows users to rename or update metadata of files only in their own user folder';

COMMENT ON POLICY "Users can delete their own ticket files" ON storage.objects IS 
'Allows users to delete files only from their own user folder within ticket-uploads bucket';
