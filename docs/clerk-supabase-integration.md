# Clerk + Supabase 네이티브 통합 가이드

> 📅 작성일: 2024-12-08  
> 🔗 참고 문서:
> - [Clerk 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
> - [Supabase 공식 문서](https://supabase.com/docs/guides/auth/third-party/clerk)

## 개요

이 프로젝트는 **Clerk 인증 + Supabase 데이터베이스** 조합을 사용합니다.
2025년 4월부터 권장되는 **네이티브 Third-Party Auth 통합** 방식을 적용했습니다.

### 기존 JWT 템플릿 방식 vs 네이티브 통합 방식

| 항목 | 기존 JWT 템플릿 방식 (deprecated) | 네이티브 통합 방식 (권장) |
|------|----------------------------------|-------------------------|
| 토큰 발급 | 매 요청마다 새 토큰 필요 | 세션 토큰 자동 사용 |
| JWT Secret 공유 | Clerk에 공유 필요 | 불필요 (보안 향상) |
| 설정 위치 | Clerk JWT 템플릿 | Supabase Third-Party Auth |

---

## 설정 방법

### 1. Clerk 대시보드 설정

1. [Clerk 대시보드](https://dashboard.clerk.com)에 로그인
2. **Supabase Integration Setup** 페이지로 이동: https://dashboard.clerk.com/setup/supabase
3. 설정 옵션 선택 후 **Activate Supabase integration** 클릭
4. **Clerk Domain** 복사 (예: `your-instance.clerk.accounts.dev`)

### 2. Supabase 대시보드 설정

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. **Authentication > Sign In / Up > Third Party Auth** 이동
3. **Add provider** 클릭 후 **Clerk** 선택
4. Clerk에서 복사한 **Clerk Domain** 붙여넣기

### 3. 환경 변수 설정

`.env` 파일에 다음 변수를 추가:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# 로컬 개발용 Clerk 도메인 (supabase/config.toml에서 사용)
CLERK_DOMAIN=your-instance.clerk.accounts.dev
```

### 4. 로컬 개발 설정 (supabase/config.toml)

```toml
[auth.third_party.clerk]
enabled = true
domain = "env(CLERK_DOMAIN)"
```

---

## 클라이언트 사용법

### 파일 구조

```
lib/supabase/
├── index.ts           # 통합 진입점
├── clerk-client.ts    # Client Component용 Hook
├── server.ts          # Server Component/Action용
├── service-role.ts    # 관리자 권한 (RLS 우회)
└── client.ts          # 공개 데이터용 (인증 불필요)
```

### 1. Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase';

export default function TaskList() {
  const supabase = useClerkSupabaseClient();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase.from('tasks').select('*');
      setTasks(data || []);
    }
    fetchTasks();
  }, [supabase]);

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.name}</li>
      ))}
    </ul>
  );
}
```

### 2. Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase';

export default async function TasksPage() {
  const supabase = createClerkSupabaseClient();
  const { data: tasks } = await supabase.from('tasks').select('*');

  return (
    <div>
      <h1>My Tasks</h1>
      <pre>{JSON.stringify(tasks, null, 2)}</pre>
    </div>
  );
}
```

### 3. Server Action에서 사용

```tsx
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createTask(name: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/tasks');
  return { data };
}
```

### 4. 관리자 작업 (RLS 우회)

⚠️ **주의**: 서버 사이드에서만 사용하세요!

```tsx
// API Route 또는 Server Action에서만 사용
import { getServiceRoleClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const supabase = getServiceRoleClient();
  
  // RLS를 우회하여 모든 데이터에 접근 가능
  const { data } = await supabase
    .from('users')
    .select('*');

  return Response.json(data);
}
```

---

## RLS (Row Level Security) 정책

Clerk 인증과 함께 RLS를 사용하려면 `auth.jwt()->>'sub'`로 현재 사용자의 Clerk ID를 확인합니다.

### 기본 패턴

```sql
-- 테이블 생성 시 user_id 컬럼에 기본값 설정
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub')
);

-- RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT 정책
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

-- INSERT 정책
CREATE POLICY "Users can insert their own tasks"
ON tasks FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- UPDATE 정책
CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- DELETE 정책
CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);
```

### 예시 마이그레이션

`supabase/migrations/20241208000000_create_tasks_example.sql` 파일을 참고하세요.

---

## 문제 해결

### 1. "permission denied" 에러

- RLS 정책이 올바르게 설정되었는지 확인
- Supabase 대시보드에서 Third-Party Auth가 활성화되었는지 확인
- Clerk 도메인이 올바른지 확인

### 2. 로컬에서 작동하지 않음

- `supabase/config.toml`에서 `[auth.third_party.clerk]` 설정 확인
- `.env`에 `CLERK_DOMAIN` 환경 변수 설정 확인
- `supabase start`로 로컬 Supabase 재시작

### 3. 데이터가 조회되지 않음

- RLS 정책의 `user_id` 컬럼이 Clerk user ID와 일치하는지 확인
- Supabase Table Editor에서 실제 데이터의 `user_id` 값 확인
- Clerk 대시보드에서 현재 로그인한 사용자의 ID 확인

---

## 참고 자료

- [Clerk + Supabase 공식 통합 가이드](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth: Clerk](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase 퀵스타트](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

