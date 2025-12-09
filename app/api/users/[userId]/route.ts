/**
 * @file app/api/users/[userId]/route.ts
 * @description 사용자 정보 API
 *
 * GET /api/users/[userId]
 * - 사용자 정보 및 통계 조회
 * - user_stats 뷰 활용
 * - 현재 로그인한 사용자의 팔로우 상태 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage, logError, extractErrorInfo } from "@/lib/utils/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let userId: string | undefined;
  try {
    const resolvedParams = await params;
    userId = resolvedParams.userId;

    if (!userId) {
      logError(new Error("userId 파라미터가 없습니다"), "사용자 정보 조회 API - 파라미터 검증");
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // userId가 Clerk ID인지 DB UUID인지 확인
    // Clerk ID는 보통 "user_"로 시작하거나 특정 패턴을 가짐
    // DB UUID는 표준 UUID 형식 (8-4-4-4-12)
    const isClerkId = userId.startsWith("user_") || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    let targetDbUserId: string | null = userId;

    // Clerk ID인 경우 DB UUID로 변환
    if (isClerkId) {
      const { data: clerkUserData, error: clerkUserError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (clerkUserError || !clerkUserData) {
        logError(clerkUserError, `사용자 정보 조회 API - Clerk ID 변환 실패 (clerk_id: ${userId})`);
        return NextResponse.json(
          { error: getErrorMessage(404, "사용자를 찾을 수 없습니다.") },
          { status: 404 }
        );
      }

      targetDbUserId = clerkUserData.id;
    }

    // user_stats 뷰에서 사용자 정보 조회
    const { data: userStats, error: userStatsError } = await supabase
      .from("user_stats")
      .select("user_id, clerk_id, name, posts_count, followers_count, following_count")
      .eq("user_id", targetDbUserId)
      .single();

    if (userStatsError || !userStats) {
      logError(userStatsError, `사용자 통계 조회 실패 (user_id: ${targetDbUserId})`);
      return NextResponse.json(
        { error: getErrorMessage(404, "사용자를 찾을 수 없습니다.") },
        { status: 404 }
      );
    }

    // 현재 로그인한 사용자 정보 (팔로우 상태 확인용)
    const { userId: clerkUserId } = await auth();
    let currentDbUserId: string | null = null;
    let isFollowing = false;
    let isOwnProfile = false;

    if (clerkUserId) {
      // Clerk ID로 DB 사용자 ID 조회
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      currentDbUserId = currentUserData?.id || null;

      // 본인 프로필인지 확인
      if (currentDbUserId === targetDbUserId) {
        isOwnProfile = true;
      } else if (currentDbUserId) {
        // 팔로우 상태 확인
        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentDbUserId)
          .eq("following_id", targetDbUserId)
          .single();

        if (followError && followError.code !== "PGRST116") {
          // PGRST116은 "no rows returned" 에러 (팔로우하지 않은 경우)
          logError(followError, "팔로우 상태 조회");
        }

        isFollowing = !!followData;
      }
    }

    // 응답 데이터 구성
    const response = {
      id: userStats.user_id,
      clerk_id: userStats.clerk_id,
      name: userStats.name,
      posts_count: userStats.posts_count || 0,
      followers_count: userStats.followers_count || 0,
      following_count: userStats.following_count || 0,
      is_following: isFollowing,
      is_own_profile: isOwnProfile,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logError(error, `사용자 정보 조회 API - 예상치 못한 에러 (userId: ${userId || "unknown"})`);
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

