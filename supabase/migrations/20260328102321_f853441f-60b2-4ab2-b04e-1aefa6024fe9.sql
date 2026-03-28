-- Create email-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload email attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'email-attachments');

-- Allow authenticated users to read email attachments
CREATE POLICY "Authenticated users can read email attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'email-attachments');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete email attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'email-attachments');

-- Allow public read access for email links
CREATE POLICY "Public can read email attachments"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'email-attachments');