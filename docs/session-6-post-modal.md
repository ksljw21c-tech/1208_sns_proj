# Session 6: 게시물 상세 모달 개발

## 작업 개요

PRD 5장과 TODO.md ##7을 기반으로 게시물 상세 모달(PostModal) 컴포넌트를 개발했습니다.

## 구현 내용

### 1. PostModal 컴포넌트 생성

**파일**: `components/post/post-modal.tsx`

- shadcn/ui Dialog 컴포넌트 기반
- 반응형 레이아웃:
  - Desktop (≥1024px): `flex-row` 레이아웃 (이미지 50% + 댓글 50%)
  - Mobile (<1024px): `flex-col` 레이아웃 (세로 배치, 전체 화면)
- 모달 크기: Desktop 최대 너비 900px, 높이 600px
- 닫기 버튼: Dialog 기본 제공 (우측 상단 ✕)

### 2. 게시물 상세 정보 표시

- **이미지 영역**:
  - Next.js Image 컴포넌트 사용
  - 1:1 비율 유지 (Desktop에서는 높이 고정)
  - 더블탭 좋아요 기능 (PostCard와 동일)
  - `object-contain`으로 이미지 전체 표시

- **헤더** (댓글 영역 상단):
  - 프로필 이미지 (32px 원형)
  - 사용자명 (Bold, 클릭 시 프로필 이동)
  - ⋯ 메뉴 (우측)

- **액션 버튼**:
  - 좋아요 버튼 (LikeButton 컴포넌트 재사용)
  - 댓글 버튼 (비활성화, 이미 댓글 영역에 있음)
  - 공유/북마크 버튼 (UI만)

- **좋아요 수**: Bold 표시

- **캡션**:
  - 사용자명 Bold + 내용
  - 전체 표시 (PostCard와 달리 "... 더 보기" 없음)

### 3. 댓글 영역 구현

- **댓글 목록**:
  - CommentList 컴포넌트 재사용 (`mode="full"`)
  - 스크롤 가능한 영역 (flex-1 overflow-y-auto)
  - 댓글 삭제 기능 (본인 댓글만)
  - `/api/comments?post_id={id}&limit=100` API 호출

- **댓글 작성 폼**:
  - CommentForm 컴포넌트 재사용
  - 하단 고정 (스크롤과 분리)
  - `autoFocus={open}` 옵션으로 모달 열릴 때 자동 포커스

- **댓글 로딩**:
  - 초기 로딩 상태 표시
  - 댓글 작성 후 자동으로 스크롤을 맨 아래로 이동

### 4. PostFeed와 PostCard 연동

**파일**: `components/post/post-feed.tsx`

- 모달 상태 관리 (`selectedPostId`)
- PostModal 컴포넌트 통합
- 이전/다음 게시물 네비게이션 지원

**파일**: `components/post/post-card.tsx`

- 이미지 클릭 시 모달 열기
- 더블탭 감지 로직 개선 (단일 클릭과 구분)
- `onCommentClick` 핸들러로 모달 열기

### 5. 이전/다음 게시물 네비게이션

- Desktop에서만 표시
- 좌우 화살표 버튼 (ChevronLeft, ChevronRight)
- 현재 피드의 게시물 목록에서 이전/다음 찾기
- 첫 번째/마지막 게시물에서는 버튼 비활성화
- 이미지 영역에 절대 위치로 배치

## 주요 기능

### 이미지 클릭 처리

PostCard에서 이미지 클릭 시:
1. 더블탭 감지 (300ms 이내): 좋아요 처리 + 큰 하트 애니메이션
2. 단일 클릭: 모달 열기

타이머를 사용하여 더블탭과 단일 클릭을 구분합니다.

### 댓글 관리

- 댓글 작성: Optimistic UI 업데이트
- 댓글 삭제: Optimistic UI 업데이트 + 실패 시 롤백
- 댓글 작성 후 자동 스크롤

### 반응형 디자인

- **Desktop (≥1024px)**:
  - 모달: `max-w-[900px] h-[600px]`
  - 레이아웃: `flex-row`
  - 이미지: `w-1/2 h-full`
  - 댓글: `w-1/2 h-full flex flex-col`

- **Mobile (<1024px)**:
  - 모달: `w-full h-full` (전체 화면)
  - 레이아웃: `flex-col`
  - 이미지: `w-full h-1/2`
  - 댓글: `w-full h-1/2 flex flex-col`

## 파일 구조

```
components/post/
├── post-modal.tsx          # 새로 생성
├── post-card.tsx           # 수정 (이미지 클릭 시 모달 열기)
└── post-feed.tsx           # 수정 (모달 상태 관리)
```

## 데이터 흐름

```
PostCard 클릭
  ↓
PostFeed에서 모달 열기 (selectedPostId 설정)
  ↓
PostModal 렌더링
  ↓
게시물 데이터 표시 (이미 PostCard에서 받은 데이터)
  ↓
댓글 API 호출 (/api/comments?post_id={id})
  ↓
CommentList 렌더링
  ↓
댓글 작성/삭제
  ↓
댓글 목록 업데이트
```

## 주요 고려사항

1. **성능**: 댓글이 많은 경우 일반 스크롤 사용 (초기 구현)
2. **UX**: 모달 열릴 때 댓글 입력창에 자동 포커스
3. **일관성**: PostCard와 동일한 스타일 및 기능 유지
4. **모바일**: 전체 화면 모달로 더 나은 사용자 경험 제공
5. **메모리 관리**: 컴포넌트 unmount 시 타이머 정리

## 테스트 항목

- [x] Desktop에서 모달 열기/닫기
- [x] Mobile에서 모달 열기/닫기
- [x] 댓글 목록 로드 및 표시
- [x] 댓글 작성 및 삭제
- [x] 좋아요 기능
- [x] 이전/다음 게시물 네비게이션 (Desktop)
- [x] 키보드 접근성 (ESC, Tab) - Dialog 기본 제공

## 다음 단계

- 프로필 페이지 개발
- 팔로우 기능 구현
- 게시물 삭제 기능

