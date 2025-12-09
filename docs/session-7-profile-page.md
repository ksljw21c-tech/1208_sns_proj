# 📋 프로필 페이지 개발 계획

## 개요

PRD.md와 db.sql을 참고하여 프로필 페이지를 개발합니다. 프로필 페이지는 사용자의 게시물을 그리드 형태로 보여주고, 팔로우/언팔로우 기능을 제공합니다.

---

## 1. 요구사항 분석

### 1.1 PRD.md 요구사항

**프로필 페이지 레이아웃 (Desktop):**
```
┌────────────────────────────────────────────┐
│ ┌────────┐                                 │
│ │        │  username                       │
│ │ 150px  │  [팔로우] [메시지]              │
│ │ 원형   │                                 │
│ │        │  게시물 12 팔로워 345 팔로잉 67  │
│ └────────┘                                 │
│            fullname                        │
│            bio bio bio...                  │
│                                            │
├────────────────────────────────────────────┤
│ [게시물] [릴스] [태그됨]                    │
├────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐                      │
│ │    │ │    │ │    │                      │
│ └────┘ └────┘ └────┘                      │ ← 3열 그리드
│ ┌────┐ ┌────┐ ┌────┐                      │
│ │    │ │    │ │    │                      │
│ └────┘ └────┘ └────┘                      │
└────────────────────────────────────────────┘
```

**주요 특징:**
- 프로필 이미지: 150px (Desktop) / 90px (Mobile)
- 통계: 게시물 수, 팔로워 수, 팔로잉 수
- 그리드: 3열 고정, 1:1 정사각형
- Hover 시 좋아요/댓글 수 표시
- 클릭 시 게시물 상세 모달 열기

**라우팅:**
- 내 프로필: `/profile` 또는 `/profile/[myUserId]`
- 다른 사람 프로필: `/profile/[userId]`

**버튼 상태:**
- 본인 프로필: "프로필 편집" 버튼 (1차 제외, Clerk 설정 사용)
- 다른 사람 프로필: "팔로우" / "팔로잉" 버튼
  - 미팔로우: "팔로우" (파란색)
  - 팔로우 중: "팔로잉" (회색)
  - Hover: "언팔로우" (빨간 테두리)

### 1.2 데이터베이스 스키마

**users 테이블:**
- `id`: UUID (Primary Key)
- `clerk_id`: TEXT (Unique, Clerk User ID)
- `name`: TEXT
- `created_at`: TIMESTAMPTZ

**user_stats 뷰:**
- `user_id`: UUID
- `clerk_id`: TEXT
- `name`: TEXT
- `posts_count`: 게시물 수
- `followers_count`: 팔로워 수
- `following_count`: 팔로잉 수

**follows 테이블:**
- `id`: UUID
- `follower_id`: UUID (팔로우하는 사람)
- `following_id`: UUID (팔로우받는 사람)
- `created_at`: TIMESTAMPTZ

### 1.3 기존 코드 분석

**Sidebar 컴포넌트:**
- 프로필 링크: `/profile/${user?.id}` (Clerk ID 사용)
- 수정 필요: Clerk ID를 DB UUID로 변환하거나, 라우트에서 처리

**PostModal 컴포넌트:**
- 재사용 가능: 프로필 페이지에서 게시물 클릭 시 모달 열기

**API 구조:**
- `/api/posts?userId=xxx`: 특정 사용자의 게시물 조회 (이미 구현됨)

---

## 2. 개발 단계별 계획

### 2.1 단계 1: API 엔드포인트 개발

#### 2.1.1 사용자 정보 조회 API
**파일:** `app/api/users/[userId]/route.ts`

**기능:**
- GET: 사용자 정보 조회 (user_stats 뷰 활용)
- Clerk ID 또는 DB UUID 모두 지원
- 현재 사용자와의 팔로우 관계 확인

**요청:**
```
GET /api/users/[userId]
```

**응답:**
```typescript
{
  data: {
    id: string; // DB UUID
    clerk_id: string;
    name: string;
    posts_count: number;
    followers_count: number;
    following_count: number;
    is_following?: boolean; // 현재 사용자가 이 사용자를 팔로우하는지
    is_followed_by?: boolean; // 이 사용자가 현재 사용자를 팔로우하는지
  }
}
```

**구현 로직:**
1. `userId` 파라미터 받기 (Clerk ID 또는 DB UUID)
2. Clerk ID인지 확인 (UUID 형식 체크)
3. Clerk ID인 경우: `users` 테이블에서 `clerk_id`로 조회하여 DB UUID 획득
4. `user_stats` 뷰에서 사용자 통계 조회
5. 현재 로그인한 사용자와의 팔로우 관계 확인
6. 응답 반환

**에러 처리:**
- 사용자를 찾을 수 없음: 404
- 인증되지 않음: 401 (팔로우 관계 확인 시)

#### 2.1.2 팔로우 API (TODO.md ##9에서 구현 예정)
**참고:** 팔로우 기능은 별도로 구현되지만, 프로필 페이지에서 사용합니다.

---

### 2.2 단계 2: 프로필 헤더 컴포넌트

**파일:** `components/profile/profile-header.tsx`

**기능:**
- 프로필 이미지 표시 (Clerk 프로필 이미지 또는 기본 아바타)
- 사용자명 표시
- 통계 표시 (게시물 수, 팔로워 수, 팔로잉 수)
- 팔로우/언팔로우 버튼 (다른 사람 프로필)
- 프로필 편집 버튼 (본인 프로필, 1차 제외)

**Props:**
```typescript
interface ProfileHeaderProps {
  user: UserStats;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}
```

**레이아웃:**
- Desktop: 프로필 이미지 150px, 통계와 버튼 가로 배치
- Mobile: 프로필 이미지 90px, 통계와 버튼 세로 배치

**스타일:**
- 프로필 이미지: 원형, 그라데이션 테두리 (Instagram 스타일)
- 통계: 숫자 Bold, 라벨 작은 글씨
- 팔로우 버튼: 파란색 배경 (#0095f6)
- 팔로잉 버튼: 회색 배경, hover 시 빨간 테두리

**구현 세부사항:**
1. Clerk에서 프로필 이미지 가져오기 (`useUser()` 훅 사용)
2. 이미지가 없으면 기본 아바타 (이니셜 표시)
3. 통계 숫자 포맷팅 (예: 1,234)
4. 팔로우 상태에 따른 버튼 텍스트/스타일 변경
5. Optimistic UI: 버튼 클릭 시 즉시 UI 업데이트

---

### 2.3 단계 3: 게시물 그리드 컴포넌트

**파일:** `components/profile/post-grid.tsx`

**기능:**
- 3열 그리드 레이아웃 (반응형)
- 1:1 정사각형 썸네일
- Hover 시 좋아요/댓글 수 오버레이 표시
- 클릭 시 게시물 상세 모달 열기

**Props:**
```typescript
interface PostGridProps {
  posts: PostStats[];
  onPostClick?: (post: PostStats) => void;
}
```

**레이아웃:**
- Desktop: 3열 그리드
- Tablet: 3열 그리드
- Mobile: 3열 그리드 (작은 화면에서는 2열 고려)

**스타일:**
- 그리드: `grid-cols-3 gap-1` (또는 `gap-px`로 Instagram 스타일)
- 썸네일: `aspect-square`, `object-cover`
- Hover 오버레이: 반투명 검은 배경, 좋아요/댓글 아이콘 + 숫자

**구현 세부사항:**
1. 게시물 목록을 3열 그리드로 렌더링
2. Next.js Image 컴포넌트 사용 (최적화)
3. Hover 시 오버레이 표시 (CSS `group-hover` 활용)
4. 클릭 시 `onPostClick` 콜백 호출
5. 빈 상태 처리 (게시물이 없을 때)

**Hover 오버레이 예시:**
```tsx
<div className="group relative aspect-square cursor-pointer">
  <Image src={post.image_url} alt="" fill className="object-cover" />
  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
    <div className="flex items-center gap-2">
      <Heart className="w-6 h-6 fill-white" />
      <span className="font-semibold">{post.likes_count}</span>
    </div>
    <div className="flex items-center gap-2">
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="font-semibold">{post.comments_count}</span>
    </div>
  </div>
</div>
```

---

### 2.4 단계 4: 프로필 페이지 라우트

**파일:** `app/(main)/profile/[userId]/page.tsx`

**기능:**
- 동적 라우트로 사용자 프로필 표시
- ProfileHeader + PostGrid 통합
- PostModal 연동
- 로딩 상태 처리
- 에러 처리

**구현 로직:**
1. `[userId]` 파라미터 받기 (Clerk ID 또는 DB UUID)
2. 사용자 정보 조회 (`/api/users/[userId]`)
3. 게시물 목록 조회 (`/api/posts?userId=xxx`)
4. 현재 사용자와 비교하여 본인 프로필인지 확인
5. PostModal 상태 관리
6. 팔로우/언팔로우 핸들러 구현

**상태 관리:**
```typescript
const [user, setUser] = useState<UserStats | null>(null);
const [posts, setPosts] = useState<PostStats[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [selectedPost, setSelectedPost] = useState<PostWithUser | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [isFollowing, setIsFollowing] = useState(false);
```

**에러 처리:**
- 사용자를 찾을 수 없음: 404 페이지 또는 에러 메시지
- 네트워크 에러: 재시도 버튼 표시

---

### 2.5 단계 5: Sidebar 프로필 링크 수정

**파일:** `components/layout/sidebar.tsx`

**현재 문제:**
- 프로필 링크가 `/profile/${user?.id}`로 되어 있음 (Clerk ID)
- 프로필 페이지는 DB UUID를 기대할 수 있음

**해결 방안:**
1. **옵션 A:** 프로필 페이지에서 Clerk ID도 처리하도록 구현 (권장)
2. **옵션 B:** Sidebar에서 Clerk ID를 DB UUID로 변환

**권장: 옵션 A**
- 프로필 페이지 API에서 Clerk ID와 DB UUID 모두 지원
- Sidebar는 그대로 유지
- 더 유연한 구조

---

### 2.6 단계 6: 통합 및 테스트

**통합 작업:**
1. PostModal과 연동
2. 팔로우 기능 연동 (TODO.md ##9)
3. 반응형 테스트
4. 에러 케이스 테스트

**테스트 시나리오:**
1. 본인 프로필 접근
2. 다른 사람 프로필 접근
3. 게시물이 없는 프로필
4. 게시물이 많은 프로필 (스크롤)
5. 팔로우/언팔로우 동작
6. 게시물 클릭 → 모달 열기
7. 모바일/태블릿/데스크톱 반응형

---

## 3. 파일 구조

```
app/
├── (main)/
│   └── profile/
│       └── [userId]/
│           └── page.tsx          # 프로필 페이지 (동적 라우트)

components/
└── profile/
    ├── profile-header.tsx         # 프로필 헤더 컴포넌트
    └── post-grid.tsx              # 게시물 그리드 컴포넌트

app/api/
└── users/
    └── [userId]/
        └── route.ts               # 사용자 정보 조회 API
```

---

## 4. 타입 정의 (lib/types.ts 확인)

이미 정의된 타입들:
- `User`: 기본 사용자 정보
- `UserStats`: 사용자 통계 포함
- `UserProfile`: 프로필 정보 (Clerk 이미지 포함)
- `PostStats`: 게시물 통계 포함
- `PostWithUser`: 게시물 + 작성자 정보

추가 필요 시:
- `ProfilePageProps`: 프로필 페이지 Props
- `FollowStatus`: 팔로우 상태 (이미 정의됨)

---

## 5. 스타일 가이드

**컬러:**
- Instagram Blue: `#0095f6` (팔로우 버튼)
- Border: `#dbdbdb`
- Text Primary: `#262626`
- Text Secondary: `#8e8e8e`
- Like: `#ed4956` (언팔로우 hover)

**타이포그래피:**
- 사용자명: `text-xl font-semibold` (20px, 600)
- 통계 숫자: `font-bold`
- 통계 라벨: `text-sm text-instagram-secondary`

**레이아웃:**
- 프로필 헤더 패딩: `p-4 lg:p-8`
- 그리드 간격: `gap-1` 또는 `gap-px`
- 반응형 브레이크포인트: Tailwind 기본값 사용

---

## 6. 개발 순서

1. ✅ **API 개발** (`app/api/users/[userId]/route.ts`)
   - 사용자 정보 조회
   - 팔로우 관계 확인

2. ✅ **ProfileHeader 컴포넌트** (`components/profile/profile-header.tsx`)
   - 기본 레이아웃
   - 통계 표시
   - 팔로우 버튼 (기본 UI만, API 연동은 나중에)

3. ✅ **PostGrid 컴포넌트** (`components/profile/post-grid.tsx`)
   - 3열 그리드 레이아웃
   - Hover 오버레이
   - 클릭 핸들러

4. ✅ **프로필 페이지** (`app/(main)/profile/[userId]/page.tsx`)
   - 데이터 페칭
   - 컴포넌트 통합
   - PostModal 연동

5. ✅ **Sidebar 수정** (필요 시)
   - 프로필 링크 확인

6. ✅ **통합 테스트**
   - 모든 시나리오 테스트
   - 반응형 확인

---

## 7. 주의사항

### 7.1 Clerk ID vs DB UUID
- Sidebar에서 Clerk ID를 사용하므로, 프로필 페이지 API는 Clerk ID도 처리해야 함
- UUID 형식 체크로 구분 가능

### 7.2 프로필 이미지
- Clerk에서 프로필 이미지 가져오기 (`useUser().user.imageUrl`)
- 없으면 기본 아바타 (이니셜 표시)

### 7.3 팔로우 기능
- 팔로우 API는 TODO.md ##9에서 별도 구현
- 프로필 페이지에서는 기본 UI만 구현하고, API 연동은 나중에

### 7.4 성능 최적화
- 게시물 이미지: Next.js Image 컴포넌트 사용
- Lazy loading: Intersection Observer 고려
- 무한 스크롤: 필요 시 구현 (현재는 전체 로드)

### 7.5 에러 처리
- 사용자를 찾을 수 없음: 404 페이지
- 네트워크 에러: 재시도 버튼
- 로딩 상태: Skeleton UI

---

## 8. 다음 단계 (TODO.md ##9)

프로필 페이지 개발 후:
- 팔로우 기능 구현 (`app/api/follows/route.ts`)
- FollowButton 컴포넌트
- ProfileHeader에 팔로우 기능 연동

---

## 9. 참고 자료

- PRD.md: 4. 프로필 페이지
- db.sql: user_stats 뷰, follows 테이블
- TODO.md: ##8. 프로필 페이지
- 기존 컴포넌트: PostModal, PostCard, LikeButton

