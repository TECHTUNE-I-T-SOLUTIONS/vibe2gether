-- Create a public bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to view receipts
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND auth.role() = 'authenticated'
);

-- Allow admins or the owner to delete/update
CREATE POLICY "Users can manage their own receipts" ON storage.objects
FOR ALL USING (
  bucket_id = 'receipts' AND auth.uid() = owner
);
