# 세션 4: 게시물 작성 기능 구현

> 📅 작성일: 2024-12-08

## 구현 내용

PRD "5. 게시물 작성" 섹션을 구현했습니다.

---

## 생성/수정된 파일

### 1. CreatePostModal 컴포넌트

**파일**: `components/post/create-post-modal.tsx`

**기능:**
- shadcn Dialog 컴포넌트 기반
- 이미지 드래그앤드롭 지원
- 이미지 클릭 선택 지원
- 이미지 미리보기 (정사각형 뷰)
- 캡션 입력 (최대 2,200자, 글자 수 표시)
- 파일 검증 (타입, 크기)
- 업로드 진행 상태 표시
- 에러 메시지 표시

**검증 규칙:**
- 이미지 타입: JPEG, PNG, GIF, WebP
- 이미지 크기: 최대 5MB
- 캡션 길이: 최대 2,200자

### 2. POST /api/posts API

**파일**: `app/api/posts/route.ts` (기존 파일에 POST 추가)

**엔드포인트**: `POST /api/posts`

**요청:**
- Content-Type: `multipart/form-data`
- Body:
  - `image`: File (필수)
  - `caption`: string (선택)

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "image_url": "https://...",
    "caption": "...",
    "created_at": "..."
  }
}
```

**처리 순서:**
1. Clerk 인증 확인
2. FormData 파싱
3. 이미지 검증 (타입, 크기)
4. 캡션 길이 검증
5. 사용자 DB ID 조회
6. Supabase Storage 업로드
7. posts 테이블 INSERT
8. 실패 시 업로드된 이미지 롤백

**Storage 경로:**
```
uploads/{clerk_user_id}/posts/{timestamp}_{filename}
```

### 3. 레이아웃 연결

**파일**: `app/(main)/layout.tsx` (수정)

**변경 사항:**
- CreatePostModal import 및 렌더링
- `isCreatePostOpen` 상태와 연결
- 게시물 생성 성공 시 `router.refresh()` 호출

---

## 데이터 흐름

```
1. Sidebar/BottomNav "만들기" 클릭
   → handleCreatePost()
   → setIsCreatePostOpen(true)

2. CreatePostModal 표시
   → 이미지 선택 (드래그앤드롭 또는 클릭)
   → 이미지 미리보기 표시
   → 캡션 입력

3. "공유하기" 버튼 클릭
   → handleSubmit()
   → fetch POST /api/posts (FormData)

4. API 처리
   → 인증 확인
   → 이미지/캡션 검증
   → Supabase Storage 업로드
   → posts 테이블 INSERT

5. 성공 응답
   → 모달 닫기
   → onSuccess() 콜백
   → router.refresh() (피드 새로고침)
```

---

## 사용법

### Sidebar에서 게시물 작성

1. 좌측 사이드바의 "만들기" 메뉴 클릭
2. 이미지 드래그앤드롭 또는 클릭하여 선택
3. 캡션 입력 (선택사항)
4. "공유하기" 버튼 클릭

### Mobile에서 게시물 작성

1. 하단 네비게이션의 + 아이콘 클릭
2. 동일한 모달 표시
3. 이미지 선택 및 캡션 입력
4. "공유하기" 버튼 클릭

---

## 테스트 방법

### 1. 개발 서버 실행

```bash
pnpm dev
```

### 2. 테스트 시나리오

1. **정상 업로드**
   - 로그인 상태에서 "만들기" 클릭
   - 5MB 이하 이미지 선택
   - 캡션 입력 후 공유
   - 피드에 새 게시물 표시 확인

2. **파일 크기 초과**
   - 5MB 이상 이미지 선택
   - 에러 메시지 표시 확인

3. **지원하지 않는 형식**
   - 이미지가 아닌 파일 선택 시도
   - 에러 메시지 표시 확인

4. **비로그인 상태**
   - 로그아웃 후 API 직접 호출
   - 401 에러 응답 확인

---

## 다음 단계

1. **6. 댓글 기능**
   - CommentList, CommentForm 컴포넌트
   - /api/comments API

2. **7. 게시물 상세 모달**
   - PostModal 컴포넌트
   - 전체 댓글 표시

