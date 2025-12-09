- [ ] `.cursor/` 디렉토리
  - [ ] `rules/` 커서룰
  - [ ] `mcp.json` MCP 서버 설정
  - [ ] `dir.md` 프로젝트 디렉토리 구조
- [ ] `.github/` 디렉토리
- [ ] `.husky/` 디렉토리
- [ ] `app/` 디렉토리
  - [ ] `favicon.ico` 파일
  - [ ] `not-found.tsx` 파일
  - [ ] `robots.ts` 파일
  - [ ] `sitemap.ts` 파일
  - [ ] `manifest.ts` 파일
- [ ] `supabase/` 디렉토리
- [ ] `public/` 디렉토리
  - [ ] `icons/` 디렉토리
  - [ ] `logo.png` 파일
  - [ ] `og-image.png` 파일
- [ ] `tsconfig.json` 파일
- [ ] `.cursorignore` 파일
- [ ] `.gitignore` 파일
- [ ] `.prettierignore` 파일
- [ ] `.prettierrc` 파일
- [ ] `tsconfig.json` 파일
- [ ] `eslint.config.mjs` 파일
- [ ] `AGENTS.md` 파일


# 📋 Mini Instagram - 개발 TODO 리스트

## 1. 기본 세팅

- [ ] Tailwind CSS 설정 (인스타 컬러 스키마)
  - [ ] `app/globals.css`에 Instagram 컬러 변수 추가
  - [ ] 타이포그래피 설정
- [ ] Supabase 데이터베이스 마이그레이션
  - [ ] `db.sql` 파일을 Supabase에 적용
  - [ ] 테이블 생성 확인 (users, posts, likes, comments, follows)
  - [ ] Views 및 Triggers 확인
- [ ] Supabase Storage 버킷 생성
  - [ ] `posts` 버킷 생성 (공개 읽기)
  - [ ] 업로드 정책 설정
- [ ] TypeScript 타입 정의
  - [ ] `lib/types.ts` 파일 생성
  - [ ] User, Post, Like, Comment, Follow 타입 정의

## 2. 레이아웃 구조

- [ ] `app/(main)/layout.tsx` 생성
  - [ ] Sidebar 통합
  - [ ] 반응형 레이아웃 (Desktop/Tablet/Mobile)
- [ ] `components/layout/Sidebar.tsx`
  - [ ] Desktop: 244px 너비, 아이콘 + 텍스트
  - [ ] Tablet: 72px 너비, 아이콘만
  - [ ] Mobile: 숨김
  - [ ] 메뉴 항목: 홈, 검색, 만들기, 프로필
  - [ ] Hover 효과 및 Active 상태 스타일
- [ ] `components/layout/Header.tsx`
  - [ ] Mobile 전용 (60px 높이)
  - [ ] 로고 + 알림/DM/프로필 아이콘
- [ ] `components/layout/BottomNav.tsx`
  - [ ] Mobile 전용 (50px 높이)
  - [ ] 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필

## 3. 홈 피드 페이지

- [ ] `app/(main)/page.tsx` 생성
  - [ ] PostFeed 컴포넌트 통합
  - [ ] 배경색 #FAFAFA 설정
- [ ] `components/post/PostCard.tsx`
  - [ ] 헤더 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
  - [ ] 이미지 영역 (1:1 정사각형)
  - [ ] 액션 버튼 (좋아요, 댓글, 공유, 북마크)
  - [ ] 좋아요 수 표시
  - [ ] 캡션 (사용자명 Bold + 내용, 2줄 초과 시 "... 더 보기")
  - [ ] 댓글 미리보기 (최신 2개)
- [ ] `components/post/PostCardSkeleton.tsx`
  - [ ] 로딩 UI (Skeleton + Shimmer 효과)
- [ ] `components/post/PostFeed.tsx`
  - [ ] 게시물 목록 렌더링
  - [ ] 무한 스크롤 (Intersection Observer)
  - [ ] 페이지네이션 (10개씩)
- [ ] `app/api/posts/route.ts`
  - [ ] GET: 게시물 목록 조회 (시간 역순 정렬)
  - [ ] 페이지네이션 지원 (limit, offset)
  - [ ] userId 파라미터 지원 (프로필 페이지용)

## 4. 좋아요 기능

- [ ] `app/api/likes/route.ts`
  - [ ] POST: 좋아요 추가
  - [ ] DELETE: 좋아요 제거
  - [ ] 인증 검증 (Clerk)
- [ ] `components/post/LikeButton.tsx`
  - [ ] 빈 하트 ↔ 빨간 하트 상태 관리
  - [ ] 클릭 애니메이션 (scale 1.3 → 1)
  - [ ] 더블탭 좋아요 (모바일, 큰 하트 fade in/out)
- [ ] PostCard에 LikeButton 통합
  - [ ] 좋아요 상태 표시
  - [ ] 좋아요 수 실시간 업데이트

## 5. 게시물 작성

- [ ] `components/post/CreatePostModal.tsx`
  - [ ] Dialog 컴포넌트 사용
  - [ ] 이미지 미리보기 UI
  - [ ] 텍스트 입력 필드 (최대 2,200자)
  - [ ] 파일 선택 버튼
  - [ ] 업로드 버튼
- [ ] `app/api/posts/route.ts`
  - [ ] POST: 게시물 생성
  - [ ] 이미지 파일 검증 (최대 5MB)
  - [ ] Supabase Storage 업로드
  - [ ] posts 테이블에 데이터 저장
  - [ ] 인증 검증 (Clerk)
- [ ] Sidebar "만들기" 버튼 연결
  - [ ] CreatePostModal 열기

## 6. 댓글 기능

- [ ] `components/comment/CommentList.tsx`
  - [ ] 댓글 목록 렌더링
  - [ ] PostCard: 최신 2개만 표시
  - [ ] 상세 모달: 전체 댓글 + 스크롤
  - [ ] 삭제 버튼 (본인만 표시)
- [ ] `components/comment/CommentForm.tsx`
  - [ ] 댓글 입력 필드 ("댓글 달기...")
  - [ ] Enter 키 또는 "게시" 버튼으로 제출
- [ ] `app/api/comments/route.ts`
  - [ ] POST: 댓글 작성
  - [ ] DELETE: 댓글 삭제 (본인만)
  - [ ] 인증 검증 (Clerk)
- [ ] PostCard에 댓글 기능 통합
  - [ ] CommentList 통합
  - [ ] CommentForm 통합

## 7. 게시물 상세 모달

- [x] `components/post/PostModal.tsx`
  - [x] Desktop: 모달 형식 (이미지 50% + 댓글 50%)
  - [x] Mobile: 전체 페이지로 전환
  - [x] 닫기 버튼 (✕)
  - [x] 이전/다음 게시물 네비게이션 (Desktop)
- [x] PostCard 클릭 시 PostModal 열기
  - [x] 게시물 상세 정보 로드
  - [x] 댓글 전체 목록 표시

## 8. 프로필 페이지

- [x] `app/api/users/[userId]/route.ts`
  - [x] **단계 1: 기본 구조 설정**
    - [x] 파일 생성 및 필요한 import 추가
    - [x] GET 핸들러 함수 생성
  - [x] **단계 2: userId 파라미터 처리**
    - [x] 동적 라우트 파라미터에서 `userId` 추출
    - [x] 에러 처리 (사용자를 찾을 수 없음: 404)
  - [x] **단계 3: 사용자 통계 조회**
    - [x] `user_stats` 뷰에서 사용자 정보 조회
    - [x] 에러 처리 (404)
  - [x] **단계 4: 팔로우 관계 확인**
    - [x] 현재 로그인한 사용자 확인 (`auth()`)
    - [x] 현재 사용자의 DB ID 조회
    - [x] 팔로우 관계 조회
    - [x] `is_following` 설정 (현재 사용자가 대상 사용자를 팔로우하는지)
    - [x] `is_own_profile` 설정 (본인 프로필인지)
  - [x] **단계 5: 응답 데이터 구성**
    - [x] user_stats 데이터와 팔로우 관계 결합
    - [x] 응답 형식에 맞게 데이터 구성
  - [ ] **단계 6: 에러 처리 및 테스트**
    - [ ] try-catch 블록 추가
    - [ ] 모든 에러 케이스 처리 (404, 500)
    - [ ] 로깅 추가
    - [ ] 테스트 시나리오 확인
      - [ ] DB UUID로 조회 (로그인 안 함)
      - [ ] Clerk ID로 조회 (로그인 안 함)
      - [ ] DB UUID로 조회 (로그인함, 팔로우 안 함)
      - [ ] Clerk ID로 조회 (로그인함, 팔로우함)
      - [ ] 본인 프로필 조회
      - [ ] 존재하지 않는 사용자 조회

### 8.2 프로필 헤더 컴포넌트

- [x] `components/profile/profile-header.tsx`
  - [x] 프로필 이미지 표시
    - [x] Clerk 프로필 이미지 가져오기 (Server Component에서 전달)
    - [x] 기본 아바타 (이니셜 표시)
    - [x] 원형, 그라데이션 테두리 (Instagram 스타일)
    - [x] 반응형 크기 (150px Desktop / 90px Mobile)
  - [x] 사용자명 표시
  - [x] 통계 표시
    - [x] 게시물 수, 팔로워 수, 팔로잉 수
    - [x] 숫자 포맷팅 (예: 1,234)
    - [x] 반응형 레이아웃 (Desktop: 가로 / Mobile: 세로)
  - [x] 버튼 구현
    - [x] "팔로우" 버튼 (파란색, 미팔로우 상태)
    - [x] "팔로잉" 버튼 (회색, 팔로우 중 상태)
    - [x] Hover 시 "언팔로우" (빨간 테두리)
    - [x] 본인 프로필일 때 "프로필 편집" 버튼 (1차에서 비활성화)

### 8.3 게시물 그리드 컴포넌트

- [x] `components/profile/post-grid.tsx`
  - [x] 3열 그리드 레이아웃
    - [x] `grid-cols-3 gap-1` (또는 `gap-2`)
    - [x] 반응형 (Mobile도 3열 유지)
  - [x] 썸네일 표시
    - [x] 1:1 정사각형 (`aspect-square`)
    - [x] Next.js Image 컴포넌트 사용
    - [x] `object-cover`로 이미지 채우기
  - [x] Hover 오버레이
    - [x] 반투명 검은 배경 (`bg-black/40`)
    - [x] 좋아요 아이콘 + 숫자
    - [x] 댓글 아이콘 + 숫자
    - [x] `group-hover`로 표시/숨김
  - [x] 클릭 핸들러
    - [x] PostModal 열기
  - [x] 빈 상태 처리 (게시물이 없을 때)

### 8.4 프로필 페이지 라우트

- [x] `app/(main)/profile/[userId]/page.tsx`
  - [x] 동적 라우트 생성
  - [x] 데이터 페칭
    - [x] 사용자 정보 조회 (user_stats 뷰)
    - [x] 게시물 목록 조회 (post_stats 뷰)
  - [x] 상태 관리
    - [x] 사용자 정보, 게시물 목록
    - [x] PostModal 상태 (PostGrid에서 관리)
    - [x] 팔로우 상태
  - [x] 컴포넌트 통합
    - [x] ProfileHeader 통합
    - [x] PostGrid 통합
  - [x] PostModal 연동
    - [x] 게시물 클릭 시 모달 열기
    - [x] 모달에서 게시물 상세 표시
  - [x] 에러 처리
    - [x] 사용자를 찾을 수 없음 (404)
  - [x] 로딩 상태
    - [x] Skeleton UI 또는 스피너
      - [x] `components/profile/profile-header-skeleton.tsx` 생성
      - [x] `components/profile/post-grid-skeleton.tsx` 생성
      - [x] `app/(main)/profile/[userId]/loading.tsx` 생성
      - [x] Next.js 15 loading.tsx로 자동 로딩 상태 표시

### 8.5 Sidebar 프로필 링크

- [x] `app/(main)/profile/page.tsx` 생성
  - [x] 본인 프로필 리다이렉트 라우트 구현
  - [x] Clerk ID를 DB UUID로 변환하여 `/profile/[dbUserId]`로 리다이렉트
  - [x] 로그인하지 않은 경우 `/sign-in`으로 리다이렉트
  - [x] 사용자를 찾을 수 없는 경우 `/`로 리다이렉트
- [x] `components/layout/sidebar.tsx` 확인
  - [x] 프로필 링크가 `/profile`로 올바르게 설정되어 있음
  - [x] 추가 수정 불필요

### 8.6 통합 및 테스트

- [x] 통합 테스트
  - [x] 본인 프로필 접근
  - [x] 다른 사람 프로필 접근
  - [x] 게시물이 없는 프로필
  - [x] 게시물이 많은 프로필
  - [x] 게시물 클릭 → 모달 열기
  - [x] 반응형 테스트 (Mobile/Tablet/Desktop)
- [x] 팔로우 기능 연동 준비 (TODO.md ##9 완료 후 활성화)
  - [x] ProfileHeader에 팔로우 기능 코드 준비 완료 (TODO 주석으로 표시)
  - [x] Optimistic UI 로직 구현 완료
  - [x] 에러 처리 및 롤백 로직 준비 완료
  - [x] 팔로우/언팔로우 버튼 동작 확인 (TODO.md ##9 완료 후)
    - [x] prop 변경 시 상태 동기화 (useEffect 추가)
    - [x] 버튼 클릭 시 API 호출 및 상태 업데이트 검증 로그 추가
    - [x] 성공/실패 시 로깅으로 동작 확인 가능
  - [x] 통계 실시간 업데이트 확인 (TODO.md ##9 완료 후)
    - [x] Optimistic UI로 즉시 통계 업데이트
    - [x] 콜백을 통한 통계 업데이트 검증 로그 추가
    - [x] 팔로워 수 변경량 검증 로직 추가

## 9. 팔로우 기능

- [x] `app/api/follows/route.ts`
  - [x] POST: 팔로우 추가
  - [x] DELETE: 팔로우 제거
  - [x] 인증 검증 (Clerk)
  - [x] 자기 자신 팔로우 방지
  - [x] 중복 팔로우 방지 (DB UNIQUE 제약조건)
- [x] `components/profile/profile-header.tsx`에 팔로우 기능 통합
  - [x] "팔로우" 버튼 (파란색, 미팔로우 상태)
  - [x] "팔로잉" 버튼 (회색, 팔로우 중 상태)
  - [x] Hover 시 "언팔로우" (빨간 테두리)
  - [x] 클릭 시 즉시 API 호출 및 UI 업데이트
  - [x] Optimistic UI 업데이트 및 롤백
- [x] ProfileHeader 팔로우 기능 활성화
  - [x] 팔로우 상태 관리
  - [x] 통계 실시간 업데이트 (클라이언트 상태)
  - [x] `onFollowChange` 콜백 추가

## 10. 게시물 삭제

- [x] `app/api/posts/[postId]/route.ts`
  - [x] DELETE: 게시물 삭제
  - [x] 본인만 삭제 가능 (인증 검증)
  - [x] Supabase Storage에서 이미지 삭제
- [x] PostCard ⋯ 메뉴
  - [x] 본인 게시물만 삭제 옵션 표시
  - [x] 삭제 확인 다이얼로그
  - [x] 삭제 후 피드에서 제거

## 11. 반응형 및 애니메이션

- [ ] 반응형 브레이크포인트 적용
  - [ ] Mobile (< 768px): BottomNav, Header 표시
  - [ ] Tablet (768px ~ 1023px): Icon-only Sidebar
  - [ ] Desktop (1024px+): Full Sidebar
- [ ] 좋아요 애니메이션
  - [ ] 클릭 시 scale(1.3) → scale(1) (0.15초)
  - [ ] 더블탭 시 큰 하트 fade in/out (1초)
- [ ] 로딩 상태
  - [ ] Skeleton UI (PostCardSkeleton)
  - [ ] Shimmer 효과

## 12. 에러 핸들링 및 최적화

- [ ] 에러 핸들링
  - [ ] API 에러 처리
  - [ ] 사용자 친화적 에러 메시지
  - [ ] 네트워크 에러 처리
- [ ] 이미지 최적화
  - [ ] Next.js Image 컴포넌트 사용
  - [ ] Lazy loading
- [ ] 성능 최적화
  - [ ] React.memo 적용 (필요한 컴포넌트)
  - [ ] useMemo, useCallback 활용

## 13. 최종 마무리

- [ ] 모바일/태블릿 반응형 테스트
  - [ ] 다양한 화면 크기에서 테스트
  - [ ] 터치 인터랙션 테스트
- [ ] 접근성 검토
  - [ ] 키보드 네비게이션
  - [ ] ARIA 레이블
- [ ] 코드 정리
  - [ ] 불필요한 주석 제거
  - [ ] 코드 포맷팅
- [ ] 배포 준비
  - [ ] 환경 변수 설정
  - [ ] Vercel 배포 설정
  - [ ] 프로덕션 빌드 테스트
