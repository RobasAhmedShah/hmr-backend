-- ============================================
-- Supabase Storage Policies for Certificate APIs
-- ============================================
-- Run this in Supabase SQL Editor
-- Project: https://klglyxwyrjtjsxfzbzfv.supabase.co
-- ============================================

-- ============================================
-- 1. CERTIFICATES BUCKET (Private)
-- ============================================
-- This bucket stores transaction and portfolio certificates
-- Should be PRIVATE - only backend can upload, signed URLs for access

-- Policy: Allow service role (backend) to upload certificates
CREATE POLICY "Service role can upload certificates"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'certificates');

-- Policy: Allow service role (backend) to read certificates
CREATE POLICY "Service role can read certificates"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'certificates');

-- Policy: Allow service role (backend) to delete certificates (optional)
CREATE POLICY "Service role can delete certificates"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'certificates');

-- Policy: Allow service role (backend) to update certificates
CREATE POLICY "Service role can update certificates"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'certificates');

-- Note: Regular users cannot directly access certificates bucket
-- They must go through backend API which generates signed URLs

-- ============================================
-- 2. PROPERTY-DOCUMENTS BUCKET (Public or Private)
-- ============================================
-- This bucket stores property legal documents
-- Can be PUBLIC (for direct access) or PRIVATE (with signed URLs)

-- Option A: PUBLIC ACCESS (Recommended for legal documents)
-- Allow anyone to read property documents
CREATE POLICY "Anyone can read property documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-documents');

-- Option B: PRIVATE ACCESS (If you want to restrict)
-- Uncomment below and comment out Option A if you want private access
-- CREATE POLICY "Service role can read property documents"
-- ON storage.objects FOR SELECT
-- TO service_role
-- USING (bucket_id = 'property-documents');

-- Policy: Allow service role (backend) to upload property documents
CREATE POLICY "Service role can upload property documents"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'property-documents');

-- Policy: Allow service role (backend) to update property documents
CREATE POLICY "Service role can update property documents"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'property-documents');

-- Policy: Allow service role (backend) to delete property documents
CREATE POLICY "Service role can delete property documents"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'property-documents');

-- ============================================
-- 3. ASSETS BUCKET (Public)
-- ============================================
-- This bucket stores certificate assets (stamps, watermarks, logos)
-- Should be PUBLIC - accessed via public URLs

-- Policy: Allow anyone to read assets (public access)
CREATE POLICY "Anyone can read assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assets');

-- Policy: Allow service role (backend) to upload assets
CREATE POLICY "Service role can upload assets"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'assets');

-- Policy: Allow service role (backend) to update assets
CREATE POLICY "Service role can update assets"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'assets');

-- Policy: Allow service role (backend) to delete assets
CREATE POLICY "Service role can delete assets"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'assets');

-- ============================================
-- ALTERNATIVE: Simplified Policies (If above don't work)
-- ============================================
-- If the above policies don't work, try these simpler ones:

-- For certificates bucket (private):
-- DROP POLICY IF EXISTS "Service role can upload certificates" ON storage.objects;
-- DROP POLICY IF EXISTS "Service role can read certificates" ON storage.objects;
-- 
-- CREATE POLICY "Backend full access to certificates"
-- ON storage.objects FOR ALL
-- TO service_role
-- USING (bucket_id = 'certificates')
-- WITH CHECK (bucket_id = 'certificates');

-- For property-documents bucket:
-- DROP POLICY IF EXISTS "Anyone can read property documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Service role can upload property documents" ON storage.objects;
-- 
-- CREATE POLICY "Public read, backend write property documents"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'property-documents');
-- 
-- CREATE POLICY "Backend write property documents"
-- ON storage.objects FOR INSERT
-- TO service_role
-- WITH CHECK (bucket_id = 'property-documents');

-- For assets bucket:
-- DROP POLICY IF EXISTS "Anyone can read assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Service role can upload assets" ON storage.objects;
-- 
-- CREATE POLICY "Public read, backend write assets"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'assets');
-- 
-- CREATE POLICY "Backend write assets"
-- ON storage.objects FOR INSERT
-- TO service_role
-- WITH CHECK (bucket_id = 'assets');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('certificates', 'property-documents', 'assets');

-- ============================================
-- NOTES
-- ============================================
-- 1. Service role key bypasses RLS, so backend operations will work
--    even without policies, but policies add an extra security layer
--
-- 2. If buckets are set to PUBLIC in Supabase dashboard, you may not
--    need SELECT policies for public access
--
-- 3. If you get "policy already exists" errors, drop them first:
--    DROP POLICY IF EXISTS "policy_name" ON storage.objects;
--
-- 4. After creating policies, test by:
--    - Uploading a file via backend
--    - Accessing public URLs
--    - Generating signed URLs

