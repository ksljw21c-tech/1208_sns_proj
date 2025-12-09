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
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // user_stats 뷰에서 사용자 정보 조회
    const { data: userStats, error: userStatsError } = await supabase
      .from("user_stats")
      .select("user_id, clerk_id, name, posts_count, followers_count, following_count")
      .eq("user_id", userId)
      .single();

    if (userStatsError || !userStats) {
      logError(userStatsError, "사용자 통계 조회");
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
      if (currentDbUserId === userId) {
        isOwnProfile = true;
      } else if (currentDbUserId) {
        // 팔로우 상태 확인
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentDbUserId)
          .eq("following_id", userId)
          .single();

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
    logError(error, "사용자 정보 조회 API");
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

