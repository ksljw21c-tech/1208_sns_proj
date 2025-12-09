# Session 7: 프로필 페이지 개발

## 작업 개요

PRD 4장과 TODO.md ##8을 기반으로 프로필 페이지를 개발했습니다. 사용자 프로필 정보, 통계(게시물/팔로워/팔로잉), 게시물 그리드를 표시하고, 팔로우 기능을 준비했습니다.

## 구현 내용

### 1. 사용자 정보 API 생성

**파일**: `app/api/users/[userId]/route.ts`

- GET 요청 처리
- `user_stats` 뷰에서 사용자 정보 조회
- 현재 로그인한 사용자의 팔로우 상태 확인
- 본인 프로필 여부 확인
- 응답 형식:
  ```typescript
  {
    id: string;
    clerk_id: string;
    name: string;
    posts_count: number;
    followers_count: number;
    following_count: number;
    is_following?: boolean;
    is_own_profile?: boolean;
  }
  ```

### 2. 프로필 페이지 동적 라우트 생성

**파일**: `app/(main)/profile/[userId]/page.tsx`

- Server Component로 구현
- `params`에서 `userId` 추출 (Next.js 15 async params)
- 사용자 정보 조회 (user_stats 뷰)
- Clerk에서 프로필 이미지 가져오기
- 게시물 목록 조회 (post_stats 뷰)
- ProfileHeader와 PostGrid 컴포넌트 통합
- 에러 처리 (사용자를 찾을 수 없음 → 404)

**본인 프로필 처리**:
- `/profile` 접근 시 현재 사용자 ID로 리다이렉트하는 별도 페이지 생성

### 3. ProfileHeader 컴포넌트 생성

**파일**: `components/profile/profile-header.tsx`

- **프로필 이미지**:
  - Desktop: 150px 원형
  - Tablet: 120px 원형
  - Mobile: 90px 원형
  - Clerk 프로필 이미지 또는 기본 아바타 (이니셜)
  - 그라데이션 테두리 (Instagram 스타일)

- **사용자명**: 큰 글씨, font-light

- **통계 표시**:
  - 게시물 수, 팔로워 수, 팔로잉 수
  - 숫자 포맷팅 (formatNumber 함수 사용)
  - 반응형 레이아웃 (Desktop: 가로 / Mobile: 세로)

- **액션 버튼**:
  - 본인 프로필: "프로필 편집" 버튼 (1차 제외, 비활성화)
  - 다른 사람 프로필: "팔로우" / "팔로잉" 버튼
    - 미팔로우: "팔로우" (파란색, `btn-instagram` 스타일)
    - 팔로우 중: "팔로잉" (회색 배경)
    - Hover 시: "언팔로우" (빨간 테두리)
  - 팔로우 API는 TODO.md ##9에서 구현 예정 (현재는 UI만 준비)

### 4. PostGrid 컴포넌트 생성

**파일**: `components/profile/post-grid.tsx`

- **그리드 레이아웃**:
  - 3열 고정 (`grid-cols-3`)
  - 반응형: Mobile에서도 3열 유지
  - `gap-1 md:gap-2`

- **게시물 썸네일**:
  - 1:1 정사각형 (`aspect-square`)
  - Next.js Image 컴포넌트 사용
  - `object-cover`로 이미지 채우기

- **Hover 효과**:
  - Hover 시 오버레이 표시 (`bg-black/40`)
  - 좋아요 수와 댓글 수 표시
  - 아이콘 (Heart, MessageCircle) + 숫자

- **클릭 처리**:
  - 게시물 클릭 시 PostModal 열기
  - PostFeed의 모달 상태 관리와 유사하게 구현

- **빈 상태**:
  - 게시물이 없을 때 메시지 표시

### 5. 본인 프로필 리다이렉트 페이지

**파일**: `app/(main)/profile/page.tsx`

- `/profile` 접근 시 현재 사용자의 DB ID를 조회
- `/profile/[userId]`로 리다이렉트
- 로그인하지 않은 경우 `/sign-in`으로 리다이렉트

### 6. Sidebar와 BottomNav 프로필 링크 연결

**파일**: `components/layout/sidebar.tsx`, `components/layout/bottom-nav.tsx`

- "프로필" 메뉴 클릭 시 `/profile`로 이동
- `/profile` 페이지에서 자동으로 본인 프로필로 리다이렉트

## 파일 구조

```
app/(main)/profile/
├── page.tsx                    # 새로 생성 (본인 프로필 리다이렉트)
└── [userId]/
    └── page.tsx                # 새로 생성 (프로필 페이지)

components/profile/
├── profile-header.tsx          # 새로 생성
└── post-grid.tsx               # 새로 생성

app/api/users/
└── [userId]/
    └── route.ts                # 새로 생성
```

## 데이터 흐름

```
프로필 페이지 접근 (/profile 또는 /profile/[userId])
  ↓
Server Component에서 userId 추출
  ↓
user_stats 뷰에서 통계 조회
  ↓
follows 테이블에서 팔로우 상태 확인
  ↓
Clerk에서 프로필 이미지 가져오기
  ↓
post_stats 뷰에서 게시물 목록 조회
  ↓
ProfileHeader 렌더링
  ↓
PostGrid 렌더링
  ↓
게시물 클릭
  ↓
PostModal 열기
```

## 주요 고려사항

1. **본인 프로필 vs 다른 사람 프로필**
   - Clerk `auth()`로 현재 사용자 확인
   - DB `user_id`로 비교하여 본인 여부 판단
   - 본인 프로필일 때 "프로필 편집" 버튼 표시 (1차에서는 비활성화)

2. **팔로우 상태 관리**
   - 초기 로드 시 팔로우 상태 확인
   - 팔로우/언팔로우 버튼 UI 준비 (API는 TODO.md ##9에서 구현)
   - Optimistic UI 업데이트 준비

3. **게시물 그리드 성능**
   - 이미지 lazy loading (Next.js Image 기본 제공)
   - 전체 게시물 로드 (초기 구현, 무한 스크롤은 추후 고려)

4. **에러 처리**
   - 사용자를 찾을 수 없을 때 `notFound()` 호출
   - Clerk 사용자 정보 조회 실패 시 기본 아바타 사용

5. **반응형 디자인**
   - Desktop: 프로필 헤더 가로 배치, 3열 그리드
   - Tablet: 프로필 헤더 가로 배치, 3열 그리드
   - Mobile: 프로필 헤더 세로 배치, 3열 그리드

## 테스트 항목

- [x] 본인 프로필 페이지 접근 (`/profile`)
- [x] 다른 사람 프로필 페이지 접근 (`/profile/[userId]`)
- [x] 프로필 정보 표시 (이미지, 이름, 통계)
- [x] 게시물 그리드 표시 (3열)
- [x] 게시물 클릭 시 모달 열기
- [x] 팔로우/언팔로우 버튼 UI (API는 TODO.md ##9에서 구현)
- [x] 반응형 레이아웃 (Desktop/Tablet/Mobile)
- [x] 존재하지 않는 사용자 접근 시 404 처리

## 다음 단계 (TODO.md ##9)

프로필 페이지에서 팔로우 버튼이 필요하므로, 팔로우 API(`/api/follows`)를 구현해야 합니다. 현재는 UI만 준비되어 있고, 실제 팔로우/언팔로우 기능은 TODO.md ##9에서 구현 예정입니다.
