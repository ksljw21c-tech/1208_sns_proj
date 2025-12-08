-- =====================================================
-- Tasks 테이블 예시 (Clerk + Supabase 네이티브 통합)
-- =====================================================
-- 이 마이그레이션은 Clerk 인증과 Supabase RLS 통합의 모범 사례를 보여줍니다.
-- 참고: https://clerk.com/docs/guides/development/integrations/databases/supabase
--
-- 핵심 개념:
-- 1. user_id 컬럼에 Clerk user ID (sub claim)를 저장
-- 2. RLS 정책에서 auth.jwt()->>'sub'로 현재 사용자 확인
-- 3. 사용자는 자신의 데이터만 읽기/쓰기 가능
-- =====================================================

-- 1. tasks 테이블 생성
-- user_id는 Clerk user ID를 저장하며, 새 레코드 생성 시 자동으로 설정됩니다
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    -- user_id: Clerk user ID (auth.jwt()->>'sub')가 자동으로 설정됨
    user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. 테이블 소유자 설정
ALTER TABLE public.tasks OWNER TO postgres;

-- 3. 테이블에 코멘트 추가
COMMENT ON TABLE public.tasks IS 'Clerk 인증 사용자의 할 일 목록';
COMMENT ON COLUMN public.tasks.user_id IS 'Clerk user ID (JWT sub claim)';

-- 4. Row Level Security (RLS) 활성화
-- ⚠️ 프로덕션에서는 반드시 활성화해야 합니다
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성

-- SELECT 정책: 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- INSERT 정책: 사용자는 자신의 tasks만 생성 가능
CREATE POLICY "Users can insert their own tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- UPDATE 정책: 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
)
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- DELETE 정책: 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- 6. 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tasks_id_seq TO authenticated;

-- 7. updated_at 자동 업데이트 트리거 (선택사항)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 사용 예시 (Next.js 코드)
-- =====================================================
-- 
-- // Client Component에서 사용
-- 'use client';
-- import { useClerkSupabaseClient } from '@/lib/supabase';
-- 
-- export default function TaskList() {
--   const supabase = useClerkSupabaseClient();
--   
--   // 조회 - 자동으로 현재 사용자의 tasks만 반환됨
--   const { data } = await supabase.from('tasks').select('*');
--   
--   // 생성 - user_id는 자동으로 설정됨
--   await supabase.from('tasks').insert({ name: 'New Task' });
-- }
-- 
-- // Server Component에서 사용
-- import { createClerkSupabaseClient } from '@/lib/supabase';
-- 
-- export default async function Page() {
--   const supabase = createClerkSupabaseClient();
--   const { data } = await supabase.from('tasks').select('*');
--   return <div>{JSON.stringify(data)}</div>;
-- }
-- =====================================================

