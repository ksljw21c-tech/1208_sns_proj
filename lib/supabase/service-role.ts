import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * @file service-role.ts
 * @description Supabase Service Role 클라이언트 (관리자 권한)
 *
 * ⚠️ 주의사항:
 * - RLS(Row Level Security)를 완전히 우회합니다
 * - 모든 데이터에 무제한 접근이 가능합니다
 * - 반드시 서버 사이드에서만 사용해야 합니다
 * - 절대로 클라이언트에 노출되면 안됩니다
 * - SUPABASE_SERVICE_ROLE_KEY는 NEXT_PUBLIC_ 접두사 없이 사용
 *
 * 사용 사례:
 * - 관리자 전용 API 라우트
 * - 웹훅에서 데이터 처리
 * - 백그라운드 작업
 * - 사용자 동기화 (Clerk → Supabase)
 *
 * @example
 * ```ts
 * // API Route에서 사용
 * import { getServiceRoleClient } from '@/lib/supabase/service-role';
 *
 * export async function POST(req: Request) {
 *   const supabase = getServiceRoleClient();
 *   const { data, error } = await supabase
 *     .from('users')
 *     .insert({ clerk_id: 'user_xxx', name: 'John' });
 * }
 * ```
 */
export function getServiceRoleClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase URL or Service Role Key is missing. Please check your environment variables."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Service Role은 세션 관리가 필요 없습니다
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
