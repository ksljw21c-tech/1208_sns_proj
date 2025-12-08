# 세션 3: 홈 피드 페이지 & 좋아요 기능 구현

> 📅 작성일: 2024-12-08

## 구현 내용

PRD "3. 홈 피드 페이지"와 "4. 좋아요 기능"을 함께 구현했습니다.

---

## 생성된 파일

### 유틸리티

#### `lib/utils.ts` (업데이트)

- `formatRelativeTime()`: 상대 시간 포맷 ("방금 전", "3시간 전", "2일 전" 등)
- `formatNumber()`: 숫자 포맷 ("1,234", "1.2만" 등)

### 컴포넌트

#### `components/post/like-button.tsx`

**좋아요 버튼 컴포넌트**

- 빈 하트 ↔ 빨간 하트 상태 전환
- 클릭 애니메이션 (scale 1.3 → 1)
- Optimistic UI 업데이트 (즉시 반영 후 API 호출)
- 실패 시 자동 롤백

#### `components/post/post-card.tsx`

**게시물 카드 컴포넌트**

- 헤더: 프로필 이미지 (32px), 사용자명, 상대 시간, 더보기 메뉴
- 이미지: 1:1 정사각형, 더블탭 좋아요
- 액션 버튼: 좋아요, 댓글, 공유(UI), 북마크(UI)
- 좋아요 수 표시
- 캡션: 100자 초과 시 "더 보기" 버튼
- 댓글 미리보기: 최신 2개

#### `components/post/post-card-skeleton.tsx`

**로딩 스켈레톤 컴포넌트**

- PostCard와 동일한 구조
- Shimmer 애니메이션 효과

#### `components/post/post-feed.tsx`

**게시물 피드 컴포넌트**

- 무한 스크롤 (Intersection Observer)
- 10개씩 페이지네이션
- 로딩/에러/빈 상태 처리
- userId 파라미터 지원 (프로필 페이지용)

### API

#### `app/api/posts/route.ts`

**GET /api/posts**

- 게시물 목록 조회 (시간 역순)
- 쿼리 파라미터:
  - `limit`: 가져올 개수 (기본 10)
  - `offset`: 시작 위치 (기본 0)
  - `userId`: 특정 사용자 게시물만
- 응답: 게시물 + 작성자 정보 + 좋아요 상태

#### `app/api/likes/route.ts`

**POST /api/likes**
- 좋아요 추가
- 요청: `{ post_id: string }`
- 인증 필수 (Clerk)

**DELETE /api/likes**
- 좋아요 제거
- 요청: `{ post_id: string }`
- 인증 필수 (Clerk)

### 페이지

#### `app/(main)/page.tsx` (업데이트)

- PostFeed 컴포넌트 통합
- 로그인/비로그인 분기 처리

---

## 주요 기능

### 1. 좋아요 애니메이션

```css
/* globals.css에 정의됨 */
.like-animation {
  animation: like-bounce 0.3s ease-in-out;
}

@keyframes like-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
```

### 2. 더블탭 좋아요

- 이미지 영역 더블탭 시 큰 하트 표시
- 1초 후 fade out
- 이미 좋아요한 경우에도 하트 애니메이션 표시

### 3. 무한 스크롤

- Intersection Observer API 사용
- 스크롤 하단 도달 시 자동 로드
- 로딩 중 스켈레톤 표시

### 4. Optimistic UI

- 좋아요 클릭 즉시 UI 업데이트
- API 실패 시 자동 롤백

---

## 데이터 흐름

```
PostFeed
  ├── fetch /api/posts (GET)
  │     ├── post_stats 뷰 조회
  │     ├── users 테이블 조회
  │     └── likes 테이블 조회 (현재 사용자)
  │
  └── PostCard
        └── LikeButton
              ├── POST /api/likes (좋아요 추가)
              └── DELETE /api/likes (좋아요 제거)
```

---

## 테스트 방법

### 1. 데이터베이스 설정

Supabase 대시보드에서 `db.sql` 실행 필요 (아직 안 했다면)

### 2. 테스트 데이터 추가

```sql
-- 테스트 사용자 추가 (Clerk ID는 실제 값으로 교체)
INSERT INTO users (clerk_id, name) VALUES 
  ('user_test1', '테스트유저1'),
  ('user_test2', '테스트유저2');

-- 테스트 게시물 추가
INSERT INTO posts (user_id, image_url, caption) VALUES 
  ((SELECT id FROM users WHERE clerk_id = 'user_test1'), 
   'https://picsum.photos/600/600?random=1', 
   '첫 번째 테스트 게시물입니다! #테스트'),
  ((SELECT id FROM users WHERE clerk_id = 'user_test2'), 
   'https://picsum.photos/600/600?random=2', 
   '두 번째 테스트 게시물입니다! 긴 캡션 테스트를 위한 내용입니다. 이 캡션은 100자가 넘어가서 더 보기 버튼이 표시되어야 합니다. 테스트 테스트 테스트.');
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

### 4. 확인 사항

- [ ] 홈 피드에서 게시물 목록 표시
- [ ] 스크롤 시 무한 스크롤 동작
- [ ] 좋아요 버튼 클릭 시 애니메이션
- [ ] 이미지 더블탭 시 큰 하트 표시
- [ ] 긴 캡션 "더 보기" 버튼 동작

---

## 다음 단계

1. **5. 게시물 작성**
   - CreatePostModal 컴포넌트
   - 이미지 업로드 (Supabase Storage)
   - POST /api/posts API

2. **6. 댓글 기능**
   - CommentList, CommentForm 컴포넌트
   - /api/comments API

