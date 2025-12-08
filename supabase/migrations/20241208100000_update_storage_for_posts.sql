-- ============================================
-- Storage 버킷 정책 업데이트 (게시물 이미지용)
-- ============================================
-- 기존 uploads 버킷을 활용하여 게시물 이미지 저장
-- 경로 구조: {clerk_user_id}/posts/{filename}
-- ============================================

-- 기존 uploads 버킷 설정 업데이트 (이미 존재하면 업데이트)
UPDATE storage.buckets 
SET 
  public = true,  -- 게시물 이미지는 공개 읽기 가능
  file_size_limit = 5242880  -- 5MB (5 * 1024 * 1024)
WHERE id = 'uploads';

-- 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;

-- 새로운 정책: 인증된 사용자가 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- 새로운 정책: 게시물 이미지는 누구나 볼 수 있음 (공개)
CREATE POLICY "Public can view uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- 새로운 정책: 인증된 사용자만 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- 새로운 정책: 인증된 사용자만 자신의 파일 업데이트 가능
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- ============================================
-- 참고: Storage 경로 구조
-- ============================================
-- uploads/{clerk_user_id}/posts/{timestamp}_{filename}
-- 
-- 예시:
-- uploads/user_abc123/posts/1702012345678_photo.jpg
-- ============================================

