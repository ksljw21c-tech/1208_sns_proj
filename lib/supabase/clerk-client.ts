"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * @file clerk-client.ts
 * @description Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 방식 (JWT 템플릿 방식 deprecated):
 * - JWT 템플릿 불필요 - Supabase가 Clerk 토큰을 직접 검증
 * - useSession().session.getToken()으로 현재 세션 토큰 사용
 * - accessToken 옵션으로 매 요청마다 자동으로 토큰 주입
 *
 * 주요 장점:
 * - 매 요청마다 새 토큰을 가져올 필요 없음
 * - Supabase JWT Secret을 Clerk와 공유할 필요 없음 (보안 향상)
 *
 * 참고 문서:
 * - https://clerk.com/docs/guides/development/integrations/databases/supabase
 * - https://supabase.com/docs/guides/auth/third-party/clerk
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('tasks').select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient(): SupabaseClient {
  // useSession()은 Clerk 세션 객체에 접근할 수 있게 해줍니다
  // session.getToken()은 Supabase API 요청에 사용할 JWT를 반환합니다
  const { session } = useSession();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseKey, {
      // accessToken 함수는 매 Supabase 요청마다 호출됩니다
      // Clerk 세션에서 최신 토큰을 가져와 Supabase에 전달합니다
      async accessToken() {
        return session?.getToken() ?? null;
      },
    });
  }, [session]);

  return supabase;
}
