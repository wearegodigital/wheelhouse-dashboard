-- Create storage bucket for task images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-images',
  'task-images',
  true,
  10485760,  -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload task images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-images'
  AND auth.role() = 'authenticated'
);

-- Allow public reads
CREATE POLICY "Public read for task images"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-images');
