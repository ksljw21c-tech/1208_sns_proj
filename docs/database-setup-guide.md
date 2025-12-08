# 데이터베이스 설정 가이드

> 📅 작성일: 2024-12-08

이 가이드는 Mini Instagram SNS 프로젝트의 Supabase 데이터베이스 설정 방법을 안내합니다.

---

## 1. 데이터베이스 테이블 생성

### 실행 방법

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. `supabase/migrations/db.sql` 파일 내용 복사하여 붙여넣기
6. **Run** 버튼 클릭

### 생성되는 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 정보 (Clerk 연동) |
| `posts` | 게시물 |
| `likes` | 좋아요 |
| `comments` | 댓글 |
| `follows` | 팔로우 관계 |

### 생성되는 뷰 (Views)

| 뷰 | 설명 |
|----|------|
| `post_stats` | 게시물 + 좋아요 수 + 댓글 수 |
| `user_stats` | 사용자 + 게시물 수 + 팔로워 수 + 팔로잉 수 |

### 확인 방법

SQL Editor에서 다음 쿼리 실행:

```sql
-- 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 뷰 확인
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';
```

---

## 2. Storage 버킷 설정

### 버킷 생성 (이미 있으면 생략)

1. Supabase 대시보드에서 **Storage** 클릭
2. **New bucket** 버튼 클릭
3. 버킷 이름: `uploads`
4. **Public bucket** 체크
5. **Create bucket** 클릭

### RLS 정책 설정

1. SQL Editor에서 `supabase/migrations/20241208100000_update_storage_for_posts.sql` 실행
2. 또는 직접 Storage > Policies에서 설정

### 경로 구조

```
uploads/
└── {clerk_user_id}/
    └── posts/
        └── {timestamp}_{filename}

예시:
uploads/user_abc123/posts/1702012345678_photo.jpg
```

---

## 3. 환경 변수 확인

`.env` 파일에 다음 변수가 설정되어 있는지 확인:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Clerk (Supabase Third-Party Auth용)
CLERK_DOMAIN=your-instance.clerk.accounts.dev
```

---

## 4. 데이터 확인

### 테스트 데이터 조회

```sql
-- 사용자 목록
SELECT * FROM users;

-- 게시물 통계
SELECT * FROM post_stats ORDER BY created_at DESC LIMIT 10;

-- 사용자 통계
SELECT * FROM user_stats;
```

---

## 5. 문제 해결

### "permission denied" 에러

1. RLS가 활성화되어 있는지 확인 (개발 중에는 비활성화 권장)
2. 권한 부여 확인:

```sql
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
```

### 테이블이 보이지 않음

1. SQL Editor에서 `SELECT * FROM pg_tables WHERE schemaname = 'public';` 실행
2. 테이블이 없으면 `db.sql` 다시 실행

### Storage 업로드 실패

1. 버킷이 존재하는지 확인
2. RLS 정책이 올바르게 설정되었는지 확인
3. 파일 크기가 5MB 이하인지 확인

---

## 참고 파일

- `supabase/migrations/db.sql` - 메인 데이터베이스 스키마
- `supabase/migrations/20241208100000_update_storage_for_posts.sql` - Storage 정책
- `lib/types.ts` - TypeScript 타입 정의

