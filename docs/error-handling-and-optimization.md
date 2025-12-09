# 에러 핸들링 및 최적화 구현 문서

## 개요

TODO.md ##12 항목에 따라 에러 핸들링, 이미지 최적화, 성능 최적화를 체계적으로 구현했습니다.

## 구현 내용

### 1. 에러 핸들링 개선

#### 1.1 공통 에러 처리 유틸리티 (`lib/utils/error-handler.ts`)

- **네트워크 에러 감지**: `isNetworkError()` 함수로 네트워크 관련 에러 자동 감지
- **HTTP 상태 코드별 메시지 매핑**: `getErrorMessage()` 함수로 사용자 친화적 메시지 제공
- **에러 타입 분류**: `classifyError()` 함수로 network, authentication, server, client, unknown 분류
- **에러 정보 추출**: `extractErrorInfo()` 함수로 통합된 에러 정보 제공
- **에러 로깅**: `logError()` 함수로 개발/프로덕션 환경별 적절한 로깅

#### 1.2 API 라우트 에러 처리 표준화

모든 API 라우트에 표준화된 에러 처리 적용:
- `app/api/posts/route.ts` (GET, POST)
- `app/api/posts/[postId]/route.ts` (DELETE)
- `app/api/comments/route.ts` (GET, POST, DELETE)
- `app/api/likes/route.ts` (POST, DELETE)
- `app/api/follows/route.ts` (POST, DELETE)
- `app/api/users/[userId]/route.ts` (GET)

**개선 사항**:
- 일관된 에러 응답 형식
- HTTP 상태 코드별 적절한 에러 메시지
- 상세한 에러 로깅 (개발 환경에서만)

#### 1.3 클라이언트 사이드 에러 처리

주요 컴포넌트의 API 호출 에러 처리 개선:
- `components/post/post-feed.tsx`: 게시물 목록 로드 에러 처리
- `components/post/post-card.tsx`: 게시물 삭제 에러 처리
- `components/post/create-post-modal.tsx`: 게시물 업로드 에러 처리
- `components/post/post-modal.tsx`: 댓글 로드/작성/삭제, 게시물 삭제 에러 처리
- `components/profile/profile-header.tsx`: 팔로우 에러 처리
- `components/post/like-button.tsx`: 좋아요 에러 처리

**개선 사항**:
- `extractApiError()` 함수로 API 응답에서 에러 추출
- `extractErrorInfo()` 함수로 통합된 에러 정보 제공
- 네트워크 에러 감지 및 적절한 메시지 표시

#### 1.4 에러 메시지 UI 컴포넌트 (`components/ui/error-message.tsx`)

- 사용자 친화적 에러 메시지 표시
- 에러 타입별 다른 색상 및 아이콘
- 재시도 버튼 제공
- 네트워크 에러 시 추가 안내 메시지

### 2. 이미지 최적화

#### 2.1 Next.js Image 컴포넌트 적용

- `components/profile/profile-header.tsx`: 프로필 이미지를 Next.js Image로 교체
- `components/post/post-modal.tsx`: 이미 적용됨 (검증 완료)
- `components/post/post-card.tsx`: 이미 적용됨 (검증 완료)
- `components/profile/post-grid.tsx`: 이미 적용됨 (검증 완료)

**개선 사항**:
- 적절한 `sizes` 속성 설정
- `priority` 속성 최적화 (첫 화면 게시물만 true)
- Lazy loading 자동 적용

#### 2.2 Next.js 이미지 설정 (`next.config.ts`)

- Supabase Storage 도메인 추가:
  - `*.supabase.co`
  - `*.supabase.in`
- Clerk 이미지 도메인 유지: `img.clerk.com`

#### 2.3 이미지 에러 처리 (`components/ui/image-with-fallback.tsx`)

- 이미지 로드 실패 시 기본 이미지 표시
- 재시도 로직 (최대 2회)
- 로딩 상태 표시

### 3. 성능 최적화

#### 3.1 React.memo 적용

다음 컴포넌트에 React.memo 적용:
- `components/post/post-card.tsx`: props 비교 함수 제공
- `components/profile/post-grid.tsx`: props 비교 함수 제공
- `components/comment/comment-list.tsx`: props 비교 함수 제공
- `components/post/like-button.tsx`: props 비교 함수 제공

**효과**: 불필요한 리렌더링 방지

#### 3.2 useMemo 활용

비용이 큰 계산을 useMemo로 최적화:
- `components/post/post-card.tsx`:
  - `isLongCaption`: 캡션 길이 확인
- `components/profile/profile-header.tsx`:
  - `formatNumber(postsCount)`: 게시물 수 포맷팅
  - `formatNumber(followersCountState)`: 팔로워 수 포맷팅
  - `formatNumber(followingCount)`: 팔로잉 수 포맷팅

**효과**: 불필요한 재계산 방지

#### 3.3 useCallback 활용

대부분의 컴포넌트에서 이미 useCallback이 적용되어 있음:
- `components/post/post-feed.tsx`: `fetchPosts`, `handleOpenModal`, `handleCloseModal`, `handleNavigate`, `handleDeletePost`
- `components/post/post-card.tsx`: `handleLikeChange`, `handleImageClick`, `handleDeletePost`
- `components/post/post-modal.tsx`: 모든 이벤트 핸들러
- `components/profile/profile-header.tsx`: `handleFollow`
- `components/post/like-button.tsx`: `handleLike`
- `components/comment/comment-form.tsx`: `handleSubmit`, `handleKeyDown`
- `components/comment/comment-list.tsx`: `handleDelete`

**효과**: 불필요한 함수 재생성 방지, 자식 컴포넌트 리렌더링 최소화

## 파일 목록

### 새로 생성된 파일
- `lib/utils/error-handler.ts`: 공통 에러 처리 유틸리티
- `components/ui/error-message.tsx`: 에러 메시지 UI 컴포넌트
- `components/ui/image-with-fallback.tsx`: 이미지 에러 처리 컴포넌트

### 수정된 파일
- `next.config.ts`: Supabase Storage 도메인 추가
- `app/api/**/route.ts`: 모든 API 라우트에 표준화된 에러 처리 적용
- `components/post/post-feed.tsx`: 에러 처리 개선, ErrorMessage 컴포넌트 사용
- `components/post/post-card.tsx`: 에러 처리 개선, React.memo 적용, useMemo 최적화
- `components/post/post-modal.tsx`: 에러 처리 개선
- `components/post/create-post-modal.tsx`: 에러 처리 개선
- `components/post/like-button.tsx`: 에러 처리 개선, React.memo 적용
- `components/profile/profile-header.tsx`: 에러 처리 개선, Next.js Image 적용, useMemo 최적화
- `components/profile/post-grid.tsx`: React.memo 적용
- `components/comment/comment-list.tsx`: React.memo 적용

## 사용 방법

### 에러 처리 유틸리티 사용

```typescript
import { extractApiError, extractErrorInfo, isNetworkError } from "@/lib/utils/error-handler";

// API 응답에서 에러 추출
const response = await fetch("/api/posts");
if (!response.ok) {
  const errorInfo = await extractApiError(response);
  throw new Error(errorInfo.message);
}

// 일반 에러에서 정보 추출
try {
  // ...
} catch (error) {
  const errorInfo = extractErrorInfo(error);
  console.error(errorInfo.message);
}
```

### 에러 메시지 컴포넌트 사용

```tsx
import ErrorMessage from "@/components/ui/error-message";

<ErrorMessage
  message="게시물을 불러오는데 실패했습니다."
  errorType="network"
  onRetry={() => fetchPosts()}
/>
```

### 이미지 Fallback 컴포넌트 사용

```tsx
import ImageWithFallback from "@/components/ui/image-with-fallback";

<ImageWithFallback
  src={imageUrl}
  alt="게시물 이미지"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 630px"
/>
```

## 참고 사항

- 모든 에러 처리는 사용자 친화적인 메시지를 제공합니다.
- 네트워크 에러는 자동으로 감지되어 적절한 안내 메시지를 표시합니다.
- 개발 환경에서는 상세한 에러 로깅이 제공됩니다.
- 프로덕션 환경에서는 간단한 로깅만 제공됩니다.
- React.memo와 useMemo는 성능 향상을 위해 적용되었지만, 과도한 사용은 피해야 합니다.

