-- Add storage_bucket column to tables that use multiple buckets
ALTER TABLE drop_point_photos ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT 'floor-plans';
ALTER TABLE room_view_photos ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT 'floor-plans';

-- drop_point_photos: extract paths, set bucket
UPDATE drop_point_photos 
SET storage_bucket = 'room-views',
    photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/room-views/', '')
WHERE photo_url LIKE '%/room-views/%';

UPDATE drop_point_photos 
SET storage_bucket = 'floor-plans',
    photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/floor-plans/', '')
WHERE photo_url LIKE '%/floor-plans/%';

UPDATE drop_point_photos SET photo_url = split_part(photo_url, '?', 1) WHERE photo_url LIKE '%?token=%';

-- room_view_photos: extract paths, set bucket
UPDATE room_view_photos 
SET storage_bucket = 'room-views',
    photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/room-views/', '')
WHERE photo_url LIKE '%/room-views/%';

UPDATE room_view_photos 
SET storage_bucket = 'floor-plans',
    photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/floor-plans/', '')
WHERE photo_url LIKE '%/floor-plans/%';

UPDATE room_view_photos SET photo_url = split_part(photo_url, '?', 1) WHERE photo_url LIKE '%?token=%';

-- room_views: always room-views bucket
UPDATE room_views 
SET photo_url = regexp_replace(photo_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/room-views/', '')
WHERE photo_url LIKE '%/room-views/%';

UPDATE room_views SET photo_url = split_part(photo_url, '?', 1) WHERE photo_url LIKE '%?token=%';

-- test_results_files: always floor-plans bucket
UPDATE test_results_files 
SET file_url = regexp_replace(file_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/floor-plans/', '')
WHERE file_url LIKE '%/floor-plans/%';

UPDATE test_results_files SET file_url = split_part(file_url, '?', 1) WHERE file_url LIKE '%?token=%';

-- tradetube_content: always tradetube-media bucket
UPDATE tradetube_content 
SET file_url = regexp_replace(file_url, '^https://[^/]+/storage/v1/object/(?:public|sign)/tradetube-media/', '')
WHERE file_url LIKE '%/tradetube-media/%';

UPDATE tradetube_content SET file_url = split_part(file_url, '?', 1) WHERE file_url LIKE '%?token=%';