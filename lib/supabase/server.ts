import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * @file server.ts
 * @description Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * 2025년 4월부터 권장되는 방식 (JWT 템플릿 방식 deprecated):
 * - JWT 템플릿 불필요 - Supabase가 Clerk 토큰을 직접 검증
 * - auth().getToken()으로 현재 세션 토큰 사용
 * - RLS 정책이 `auth.jwt()->>'sub'`로 Clerk user ID를 확인
 *
 * 사용 가능한 환경:
 * - Server Components
 * - Server Actions
 * - Route Handlers (API Routes)
 *
 * 참고 문서:
 * - https://clerk.com/docs/guides/development/integrations/databases/supabase
 * - https://supabase.com/docs/guides/auth/third-party/clerk
 *
 * @example
 * ```tsx
 * // Server Component에서 사용
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data } = await supabase.from('tasks').select('*');
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Server Action에서 사용
 * 'use server';
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export async function createTask(name: string) {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase
 *     .from('tasks')
 *     .insert({ name })
 *     .select()
 *     .single();
 *   return { data, error };
 * }
 * ```
 */
export function createClerkSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseKey, {
    // accessToken 함수는 매 Supabase 요청마다 호출됩니다
    // Clerk의 auth()에서 서버 사이드 토큰을 가져옵니다
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
