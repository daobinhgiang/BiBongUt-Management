-- Make bucket-list-photos private (no public CDN access, use signed URLs)
UPDATE storage.buckets SET public = false WHERE id = 'bucket-list-photos';
