import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * @file client.ts
 * @description 인증 불필요한 공개 데이터용 Supabase 클라이언트
 *
 * 사용 사례:
 * - RLS 정책이 `to anon`으로 설정된 공개 테이블 조회
 * - 로그인하지 않은 사용자가 볼 수 있는 데이터
 * - 공개 API 엔드포인트
 *
 * ⚠️ 주의사항:
 * - 이 클라이언트는 인증된 사용자의 데이터에 접근할 수 없습니다
 * - 인증이 필요한 작업에는 useClerkSupabaseClient (클라이언트)
 *   또는 createClerkSupabaseClient (서버)를 사용하세요
 *
 * @example
 * ```tsx
 * import { createAnonClient } from '@/lib/supabase/client';
 *
 * // 공개 데이터 조회
 * const supabase = createAnonClient();
 * const { data } = await supabase
 *   .from('public_posts')
 *   .select('*');
 * ```
 */
export function createAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey);
}

// 기존 코드와의 호환성을 위한 기본 내보내기
// 새 코드에서는 createAnonClient() 함수 사용을 권장합니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
