/**
 * @file app/(main)/profile/page.tsx
 * @description 본인 프로필 리다이렉트 페이지
 *
 * PRD 7.5 프로필 기반
 * - /profile 접근 시 본인 프로필로 자동 리다이렉트
 * - Clerk ID를 DB UUID로 변환하여 /profile/[dbUserId]로 이동
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  // 현재 로그인한 사용자 확인
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    redirect("/sign-in");
  }

  const supabase = createClerkSupabaseClient();

  // Clerk ID로 DB UUID 조회
  const { data: userData, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (error || !userData) {
    // 사용자를 찾을 수 없으면 동기화가 안 된 경우
    // SyncUserProvider가 처리하므로 홈으로 리다이렉트
    console.error("사용자 조회 에러:", error);
    redirect("/");
  }

  // 본인 프로필 페이지로 리다이렉트
  redirect(`/profile/${userData.id}`);
}
