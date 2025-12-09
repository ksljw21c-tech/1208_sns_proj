# 📋 사용자 정보 조회 API 개발 계획 (TODO.md 8.1)

## 개요

프로필 페이지에서 사용자 정보를 조회하기 위한 API 엔드포인트를 개발합니다. 이 API는 Clerk ID 또는 DB UUID 모두를 지원하며, 사용자 통계와 팔로우 관계를 포함합니다.

---

## 1. 요구사항 분석

### 1.1 PRD.md 요구사항

**프로필 페이지에 필요한 정보:**
- 사용자 기본 정보 (이름, 프로필 이미지)
- 통계: 게시물 수, 팔로워 수, 팔로잉 수
- 팔로우 상태: 현재 사용자가 이 사용자를 팔로우하는지 여부

### 1.2 데이터베이스 스키마

**user_stats 뷰:**
```sql
SELECT
    u.id as user_id,
    u.clerk_id,
    u.name,
    COUNT(DISTINCT p.id) as posts_count,
    COUNT(DISTINCT f1.id) as followers_count,  -- 나를 팔로우하는 사람들
    COUNT(DISTINCT f2.id) as following_count   -- 내가 팔로우하는 사람들
FROM public.users u
LEFT JOIN public.posts p ON u.id = p.user_id
LEFT JOIN public.follows f1 ON u.id = f1.following_id
LEFT JOIN public.follows f2 ON u.id = f2.follower_id
GROUP BY u.id, u.clerk_id, u.name;
```

**follows 테이블:**
- `follower_id`: 팔로우하는 사람 (UUID)
- `following_id`: 팔로우받는 사람 (UUID)
- `UNIQUE(follower_id, following_id)`: 중복 팔로우 방지

### 1.3 기존 API 패턴 분석

**app/api/posts/route.ts 패턴:**
- Clerk ID를 DB UUID로 변환하는 로직 존재
- `createClerkSupabaseClient()` 사용
- 에러 처리: 401, 404, 500

**app/api/likes/route.ts 패턴:**
- 인증 확인: `auth()` 사용
- 사용자 조회: `users` 테이블에서 `clerk_id`로 조회
- 에러 처리: 명확한 에러 메시지

---

## 2. API 명세

### 2.1 엔드포인트

```
GET /api/users/[userId]
```

### 2.2 요청 파라미터

**경로 파라미터:**
- `userId`: string (Clerk ID 또는 DB UUID)

**예시:**
- Clerk ID: `/api/users/user_2abc123def456`
- DB UUID: `/api/users/550e8400-e29b-41d4-a716-446655440000`

### 2.3 응답 형식

**성공 응답 (200):**
```typescript
{
  data: {
    id: string;              // DB UUID
    clerk_id: string;        // Clerk User ID
    name: string;            // 사용자 이름
    posts_count: number;     // 게시물 수
    followers_count: number; // 팔로워 수
    following_count: number;// 팔로잉 수
    is_following?: boolean;  // 현재 사용자가 이 사용자를 팔로우하는지 (로그인 시만)
    is_followed_by?: boolean;// 이 사용자가 현재 사용자를 팔로우하는지 (로그인 시만)
  }
}
```

**에러 응답:**
- `401 Unauthorized`: 로그인이 필요한 경우 (팔로우 관계 확인 시)
- `404 Not Found`: 사용자를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

## 3. 구현 계획

### 3.1 파일 구조

```
app/api/users/
└── [userId]/
    └── route.ts
```

### 3.2 구현 단계

#### 단계 1: 기본 구조 설정

**작업 내용:**
1. 파일 생성: `app/api/users/[userId]/route.ts`
2. 필요한 import 추가
3. GET 핸들러 함수 생성

**코드 구조:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 구현 로직
  } catch (error) {
    // 에러 처리
  }
}
```

#### 단계 2: userId 파라미터 처리

**작업 내용:**
1. 동적 라우트 파라미터에서 `userId` 추출
2. Clerk ID인지 DB UUID인지 판별
3. UUID 형식 체크 함수 작성

**UUID 형식 체크:**
```typescript
/**
 * UUID 형식인지 확인 (8-4-4-4-12 형식)
 * 예: 550e8400-e29b-41d4-a716-446655440000
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
```

**로직:**
```typescript
const { userId } = await params;
let targetDbUserId: string;

if (isUUID(userId)) {
  // DB UUID인 경우
  targetDbUserId = userId;
} else {
  // Clerk ID인 경우: users 테이블에서 조회
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (userError || !userData) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  targetDbUserId = userData.id;
}
```

#### 단계 3: 사용자 통계 조회

**작업 내용:**
1. `user_stats` 뷰에서 사용자 정보 조회
2. 에러 처리

**쿼리:**
```typescript
const { data: userStats, error: statsError } = await supabase
  .from("user_stats")
  .select("*")
  .eq("user_id", targetDbUserId)
  .single();

if (statsError || !userStats) {
  console.error("사용자 통계 조회 에러:", statsError);
  return NextResponse.json(
    { error: "사용자를 찾을 수 없습니다." },
    { status: 404 }
  );
}
```

#### 단계 4: 팔로우 관계 확인 (선택적)

**작업 내용:**
1. 현재 로그인한 사용자 확인
2. 로그인한 경우에만 팔로우 관계 조회
3. `is_following`: 현재 사용자가 대상 사용자를 팔로우하는지
4. `is_followed_by`: 대상 사용자가 현재 사용자를 팔로우하는지

**로직:**
```typescript
let isFollowing = false;
let isFollowedBy = false;

// 현재 로그인한 사용자 확인
const { userId: currentClerkUserId } = await auth();

if (currentClerkUserId) {
  // 현재 사용자의 DB ID 조회
  const { data: currentUserData } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", currentClerkUserId)
    .single();

  if (currentUserData) {
    const currentDbUserId = currentUserData.id;

    // 자기 자신인 경우 팔로우 관계 확인 불필요
    if (currentDbUserId !== targetDbUserId) {
      // is_following: 현재 사용자가 대상 사용자를 팔로우하는지
      const { data: followingData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentDbUserId)
        .eq("following_id", targetDbUserId)
        .single();

      isFollowing = !!followingData;

      // is_followed_by: 대상 사용자가 현재 사용자를 팔로우하는지
      const { data: followedByData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", targetDbUserId)
        .eq("following_id", currentDbUserId)
        .single();

      isFollowedBy = !!followedByData;
    }
  }
}
```

**최적화:**
- 두 개의 쿼리를 하나로 합치기 (OR 조건 사용)
- 또는 단일 쿼리로 양방향 관계 확인

**최적화된 쿼리:**
```typescript
if (currentDbUserId && currentDbUserId !== targetDbUserId) {
  // 양방향 팔로우 관계를 한 번에 조회
  const { data: followRelations } = await supabase
    .from("follows")
    .select("follower_id, following_id")
    .or(
      `and(follower_id.eq.${currentDbUserId},following_id.eq.${targetDbUserId}),and(follower_id.eq.${targetDbUserId},following_id.eq.${currentDbUserId})`
    );

  if (followRelations) {
    isFollowing = followRelations.some(
      (r) => r.follower_id === currentDbUserId && r.following_id === targetDbUserId
    );
    isFollowedBy = followRelations.some(
      (r) => r.follower_id === targetDbUserId && r.following_id === currentDbUserId
    );
  }
}
```

#### 단계 5: 응답 데이터 구성

**작업 내용:**
1. user_stats 데이터와 팔로우 관계 결합
2. 응답 형식에 맞게 데이터 구성

**코드:**
```typescript
const response = {
  id: userStats.user_id,
  clerk_id: userStats.clerk_id,
  name: userStats.name,
  posts_count: userStats.posts_count || 0,
  followers_count: userStats.followers_count || 0,
  following_count: userStats.following_count || 0,
  ...(currentClerkUserId && {
    is_following: isFollowing,
    is_followed_by: isFollowedBy,
  }),
};

return NextResponse.json({ data: response });
```

#### 단계 6: 에러 처리

**에러 케이스:**
1. 사용자를 찾을 수 없음 (404)
2. 네트워크/DB 에러 (500)
3. 예상치 못한 에러 (500)

**에러 처리:**
```typescript
try {
  // 구현 로직
} catch (error) {
  console.error("API 에러:", error);
  return NextResponse.json(
    { error: "서버 오류가 발생했습니다." },
    { status: 500 }
  );
}
```

---

## 4. 전체 코드 구조

### 4.1 완성된 코드 구조

```typescript
/**
 * @file app/api/users/[userId]/route.ts
 * @description 사용자 정보 조회 API
 *
 * GET /api/users/[userId]
 * - 사용자 정보 조회 (user_stats 뷰 활용)
 * - Clerk ID 또는 DB UUID 모두 지원
 * - 현재 사용자와의 팔로우 관계 확인 (로그인 시)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * UUID 형식인지 확인
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = createClerkSupabaseClient();

    // 1. userId가 Clerk ID인지 DB UUID인지 판별
    let targetDbUserId: string;

    if (isUUID(userId)) {
      // DB UUID인 경우
      targetDbUserId = userId;
    } else {
      // Clerk ID인 경우: users 테이블에서 조회
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      targetDbUserId = userData.id;
    }

    // 2. 사용자 통계 조회 (user_stats 뷰)
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", targetDbUserId)
      .single();

    if (statsError || !userStats) {
      console.error("사용자 통계 조회 에러:", statsError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 팔로우 관계 확인 (선택적, 로그인한 경우에만)
    let isFollowing = false;
    let isFollowedBy = false;

    const { userId: currentClerkUserId } = await auth();

    if (currentClerkUserId) {
      // 현재 사용자의 DB ID 조회
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentClerkUserId)
        .single();

      if (currentUserData && currentUserData.id !== targetDbUserId) {
        const currentDbUserId = currentUserData.id;

        // 양방향 팔로우 관계 조회
        const { data: followRelations } = await supabase
          .from("follows")
          .select("follower_id, following_id")
          .or(
            `and(follower_id.eq.${currentDbUserId},following_id.eq.${targetDbUserId}),and(follower_id.eq.${targetDbUserId},following_id.eq.${currentDbUserId})`
          );

        if (followRelations) {
          isFollowing = followRelations.some(
            (r) => r.follower_id === currentDbUserId && r.following_id === targetDbUserId
          );
          isFollowedBy = followRelations.some(
            (r) => r.follower_id === targetDbUserId && r.following_id === currentDbUserId
          );
        }
      }
    }

    // 4. 응답 데이터 구성
    const response = {
      id: userStats.user_id,
      clerk_id: userStats.clerk_id,
      name: userStats.name,
      posts_count: userStats.posts_count || 0,
      followers_count: userStats.followers_count || 0,
      following_count: userStats.following_count || 0,
      ...(currentClerkUserId && {
        is_following: isFollowing,
        is_followed_by: isFollowedBy,
      }),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
```

---

## 5. 테스트 시나리오

### 5.1 성공 케이스

1. **DB UUID로 조회 (로그인 안 함)**
   - 요청: `GET /api/users/550e8400-e29b-41d4-a716-446655440000`
   - 응답: 사용자 정보 + 통계 (팔로우 관계 없음)

2. **Clerk ID로 조회 (로그인 안 함)**
   - 요청: `GET /api/users/user_2abc123def456`
   - 응답: 사용자 정보 + 통계 (팔로우 관계 없음)

3. **DB UUID로 조회 (로그인함, 팔로우 안 함)**
   - 요청: `GET /api/users/550e8400-e29b-41d4-a716-446655440000`
   - 응답: 사용자 정보 + 통계 + `is_following: false`, `is_followed_by: false`

4. **Clerk ID로 조회 (로그인함, 팔로우함)**
   - 요청: `GET /api/users/user_2abc123def456`
   - 응답: 사용자 정보 + 통계 + `is_following: true`, `is_followed_by: false`

5. **본인 프로필 조회 (로그인함)**
   - 요청: `GET /api/users/[myUserId]`
   - 응답: 사용자 정보 + 통계 (팔로우 관계 없음, 자기 자신이므로)

### 5.2 에러 케이스

1. **존재하지 않는 사용자 (Clerk ID)**
   - 요청: `GET /api/users/user_nonexistent`
   - 응답: `404 Not Found` + `{ error: "사용자를 찾을 수 없습니다." }`

2. **존재하지 않는 사용자 (DB UUID)**
   - 요청: `GET /api/users/00000000-0000-0000-0000-000000000000`
   - 응답: `404 Not Found` + `{ error: "사용자를 찾을 수 없습니다." }`

3. **잘못된 형식의 userId**
   - 요청: `GET /api/users/invalid_format`
   - 응답: `404 Not Found` (Clerk ID로 처리하지만 찾을 수 없음)

---

## 6. 개발 체크리스트

### 6.1 구현 단계

- [ ] **단계 1: 기본 구조 설정**
  - [ ] 파일 생성: `app/api/users/[userId]/route.ts`
  - [ ] 필요한 import 추가
  - [ ] GET 핸들러 함수 생성

- [ ] **단계 2: userId 파라미터 처리**
  - [ ] 동적 라우트 파라미터에서 `userId` 추출
  - [ ] UUID 형식 체크 함수 작성
  - [ ] Clerk ID → DB UUID 변환 로직 구현
  - [ ] 에러 처리 (사용자를 찾을 수 없음)

- [ ] **단계 3: 사용자 통계 조회**
  - [ ] `user_stats` 뷰에서 조회
  - [ ] 에러 처리

- [ ] **단계 4: 팔로우 관계 확인**
  - [ ] 현재 로그인한 사용자 확인
  - [ ] 현재 사용자의 DB ID 조회
  - [ ] 양방향 팔로우 관계 조회
  - [ ] `is_following`, `is_followed_by` 설정

- [ ] **단계 5: 응답 데이터 구성**
  - [ ] user_stats 데이터와 팔로우 관계 결합
  - [ ] 응답 형식에 맞게 데이터 구성

- [ ] **단계 6: 에러 처리**
  - [ ] try-catch 블록 추가
  - [ ] 모든 에러 케이스 처리
  - [ ] 로깅 추가

### 6.2 테스트

- [ ] DB UUID로 조회 테스트
- [ ] Clerk ID로 조회 테스트
- [ ] 로그인하지 않은 경우 테스트
- [ ] 로그인한 경우 테스트 (팔로우 안 함)
- [ ] 로그인한 경우 테스트 (팔로우함)
- [ ] 본인 프로필 조회 테스트
- [ ] 존재하지 않는 사용자 테스트
- [ ] 에러 응답 형식 확인

### 6.3 코드 품질

- [ ] TypeScript 타입 정의 확인
- [ ] 에러 메시지 명확성 확인
- [ ] 코드 주석 추가
- [ ] 린터 에러 확인 및 수정

---

## 7. 주의사항

### 7.1 UUID 형식 체크

- UUID는 `8-4-4-4-12` 형식 (하이픈 포함)
- Clerk ID는 보통 `user_`로 시작하는 문자열
- 정규식으로 구분 가능

### 7.2 팔로우 관계 조회 최적화

- 두 개의 쿼리를 하나로 합치기 (OR 조건)
- 자기 자신인 경우 팔로우 관계 확인 불필요

### 7.3 에러 처리

- 사용자를 찾을 수 없을 때 명확한 에러 메시지
- 네트워크/DB 에러는 로깅 후 일반적인 에러 메시지 반환

### 7.4 성능 고려

- `user_stats` 뷰 사용으로 통계 계산 최적화
- 팔로우 관계는 로그인한 경우에만 조회
- 불필요한 쿼리 최소화

---

## 8. 다음 단계

API 개발 완료 후:
1. 프로필 페이지에서 API 호출 테스트
2. ProfileHeader 컴포넌트에서 사용
3. 팔로우 기능 연동 (TODO.md ##9)

---

## 9. 참고 자료

- PRD.md: 4. 프로필 페이지
- db.sql: user_stats 뷰, follows 테이블
- 기존 API: `app/api/posts/route.ts`, `app/api/likes/route.ts`
- 타입 정의: `lib/types.ts` (UserStats, FollowStatus)

