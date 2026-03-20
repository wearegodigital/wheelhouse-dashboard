INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'context-attachments',
    'context-attachments',
    false,
    10485760,
    ARRAY[
        'text/plain', 'text/markdown', 'text/csv', 'text/html',
        'text/css', 'text/javascript', 'application/json',
        'application/pdf', 'application/javascript', 'application/typescript',
        'application/xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'
    ]
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Service role full access on context-attachments"
ON storage.objects FOR ALL
USING (bucket_id = 'context-attachments')
WITH CHECK (bucket_id = 'context-attachments');
