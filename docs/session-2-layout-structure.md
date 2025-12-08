# 세션 2: 레이아웃 구조 구현

> 📅 작성일: 2024-12-08

## 구현 내용

PRD "2. 레이아웃 구조"를 기반으로 Instagram 스타일 반응형 레이아웃을 구현했습니다.

---

## 생성된 파일

### 1. `components/layout/sidebar.tsx`

**Desktop/Tablet 사이드바 컴포넌트**

- Desktop (1024px+): 244px 너비, 아이콘 + 텍스트
- Tablet (768px ~ 1024px): 72px 너비, 아이콘만
- Mobile (< 768px): 숨김

**메뉴 항목:**
- 🏠 홈 (`/`)
- 🔍 검색 (`/search`)
- ➕ 만들기 (모달 열기)
- 👤 프로필 (`/profile/{userId}`)

### 2. `components/layout/header.tsx`

**Mobile 전용 상단 헤더**

- 높이: 60px
- 로고 "Instagram"
- 우측: 알림 아이콘, DM 아이콘, 프로필/로그인

### 3. `components/layout/bottom-nav.tsx`

**Mobile 전용 하단 네비게이션**

- 높이: 50px
- 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필

### 4. `app/(main)/layout.tsx`

**메인 레이아웃 (Route Group)**

- Sidebar, Header, BottomNav 통합
- 반응형 레이아웃 처리
- 게시물 작성 모달 상태 관리 (TODO)

### 5. `app/(main)/page.tsx`

**홈 피드 페이지**

- 로그인/비로그인 상태 분기
- PostCard 스켈레톤 플레이스홀더

---

## 수정된 파일

### `app/layout.tsx`

- 기존 Navbar 제거
- 메타데이터 업데이트: "Mini Instagram"

---

## 삭제된 파일

### `components/Navbar.tsx`

- 새 레이아웃 시스템으로 완전 대체

---

## 반응형 브레이크포인트

```
Mobile:  < 768px   → Header + BottomNav
Tablet:  768px ~ 1023px → Icon-only Sidebar (72px)
Desktop: 1024px+   → Full Sidebar (244px)
```

---

## 사용법

### 새 페이지 추가

`app/(main)/` 폴더 내에 새 페이지를 추가하면 자동으로 레이아웃이 적용됩니다.

```tsx
// app/(main)/search/page.tsx
export default function SearchPage() {
  return <div>검색 페이지</div>;
}
```

### 게시물 작성 모달 연결 (TODO)

`CreatePostModal` 컴포넌트 생성 후 `app/(main)/layout.tsx`에 연결:

```tsx
// layout.tsx에서
const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

// CreatePostModal 컴포넌트 추가
<CreatePostModal 
  open={isCreatePostOpen} 
  onClose={() => setIsCreatePostOpen(false)} 
/>
```

---

## 다음 단계

1. **3. 홈 피드 페이지**
   - PostCard 컴포넌트 구현
   - PostFeed 컴포넌트 구현
   - /api/posts GET API 구현

2. **4. 좋아요 기능**
   - LikeButton 컴포넌트
   - /api/likes API

---

## 테스트 방법

개발 서버를 실행하여 레이아웃을 확인하세요:

```bash
pnpm dev
```

브라우저에서 다음을 확인:
- Desktop (1024px+): 좌측에 전체 사이드바
- Tablet (768px ~ 1023px): 좌측에 아이콘만 있는 사이드바
- Mobile (< 768px): 상단 헤더 + 하단 네비게이션

