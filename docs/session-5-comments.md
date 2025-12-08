# 세션 5: 댓글 기능 구현

> 📅 작성일: 2024-12-08

## 구현 내용

PRD "6. 댓글 기능" 섹션을 구현했습니다.

---

## 생성/수정된 파일

### 1. CommentList 컴포넌트

**파일**: `components/comment/comment-list.tsx`

**기능:**
- 두 가지 모드 지원:
  - `preview` 모드: PostCard용, 최신 2개만 표시
  - `full` 모드: 상세 모달용, 전체 댓글 표시
- 각 댓글: 사용자명 + 내용 + (full 모드에서) 시간
- 삭제 버튼: 본인 댓글만 표시 (hover 시)
- Clerk user ID로 본인 확인

### 2. CommentForm 컴포넌트

**파일**: `components/comment/comment-form.tsx`

**기능:**
- 댓글 입력 필드 (placeholder: "댓글 달기...")
- Enter 키 또는 "게시" 버튼으로 제출
- 빈 댓글 제출 방지
- 로딩 상태 표시 (스피너)
- 최대 500자 제한
- autoFocus 옵션 지원

### 3. 댓글 API

**파일**: `app/api/comments/route.ts`

**GET /api/comments**
- 특정 게시물의 댓글 목록 조회
- 쿼리: `?post_id={id}&limit={n}`
- 시간순 정렬 (오래된 것 먼저)

**POST /api/comments**
- 댓글 작성
- 요청: `{ post_id, content }`
- 응답: 생성된 댓글 + 작성자 정보
- Clerk 인증 필수

**DELETE /api/comments**
- 댓글 삭제
- 요청: `{ comment_id }`
- 본인 댓글만 삭제 가능 (403 에러)
- Clerk 인증 필수

### 4. PostCard 통합

**파일**: `components/post/post-card.tsx` (수정)

**변경 사항:**
- CommentList (preview 모드) 통합
- CommentForm 통합
- 댓글 상태 관리 (comments, commentCount)
- 댓글 작성/삭제 핸들러
- Optimistic UI (즉시 반영, 실패 시 롤백)

---

## 데이터 흐름

### 댓글 작성

```
CommentForm 입력 → Enter/게시 클릭
  → handleCommentSubmit()
  → POST /api/comments
  → 성공: setComments([...prev, newComment])
  → 실패: 에러 throw (폼에서 처리)
```

### 댓글 삭제

```
삭제 버튼 클릭
  → handleCommentDelete(commentId)
  → Optimistic: 목록에서 즉시 제거
  → DELETE /api/comments
  → 성공: 완료
  → 실패: 롤백 (목록에 다시 추가)
```

---

## API 상세

### POST /api/comments

**요청:**
```json
{
  "post_id": "uuid",
  "content": "댓글 내용"
}
```

**응답 (성공):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "댓글 내용",
    "created_at": "...",
    "user": {
      "id": "uuid",
      "clerk_id": "...",
      "name": "사용자명"
    }
  }
}
```

### DELETE /api/comments

**요청:**
```json
{
  "comment_id": "uuid"
}
```

**응답 (성공):**
```json
{
  "success": true
}
```

**응답 (권한 없음):**
```json
{
  "error": "본인의 댓글만 삭제할 수 있습니다."
}
```

---

## 테스트 방법

### 1. 개발 서버 실행

```bash
pnpm dev
```

### 2. 테스트 시나리오

1. **댓글 작성**
   - 게시물 하단 입력창에 텍스트 입력
   - Enter 또는 "게시" 클릭
   - 댓글 목록에 즉시 표시 확인

2. **댓글 삭제**
   - 본인 댓글에 마우스 호버
   - 삭제 버튼 표시 확인
   - 클릭 시 즉시 삭제 확인

3. **다른 사람 댓글**
   - 다른 사용자 댓글에는 삭제 버튼 없음 확인

4. **빈 댓글 방지**
   - 빈 입력창에서 Enter → 제출 안 됨

---

## 다음 단계

1. **7. 게시물 상세 모달**
   - PostModal 컴포넌트
   - 전체 댓글 표시 (CommentList full 모드)
   - Desktop: 모달, Mobile: 전체 페이지

2. **8. 프로필 페이지**
   - ProfileHeader 컴포넌트
   - PostGrid 컴포넌트

