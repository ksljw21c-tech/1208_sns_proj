/**
 * @file app/api/follows/route.ts
 * @description 팔로우 API (POST: 추가, DELETE: 제거)
 *
 * POST /api/follows - 팔로우 추가
 * DELETE /api/follows - 팔로우 제거
 *
 * 요청 본문: { user_id: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage, logError, extractErrorInfo } from "@/lib/utils/error-handler";

/**
 * POST /api/follows - 팔로우 추가
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 DB ID 조회
    const { data: currentUserData, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUserData) {
      console.error("사용자 조회 에러:", currentUserError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 자기 자신 팔로우 방지
    if (currentUserData.id === user_id) {
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // 팔로우할 사용자 존재 확인
    const { data: targetUserData, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (targetUserError || !targetUserData) {
      return NextResponse.json(
        { error: "팔로우할 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 팔로우 추가
    const { data: followData, error: followError } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUserData.id,
        following_id: user_id,
      })
      .select()
      .single();

    if (followError) {
      // 23505는 unique violation (이미 팔로우 중인 경우)
      if (followError.code === "23505") {
        return NextResponse.json(
          { error: "이미 팔로우 중입니다." },
          { status: 409 }
        );
      }

      // 23514는 check constraint violation (자기 자신 팔로우 시도)
      if (followError.code === "23514") {
        return NextResponse.json(
          { error: "자기 자신을 팔로우할 수 없습니다." },
          { status: 400 }
        );
      }

      logError(followError, "팔로우 추가");
      return NextResponse.json(
        { error: getErrorMessage(500, "팔로우 처리에 실패했습니다.") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: followData,
    });
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logError(error, "팔로우 추가 API");
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/follows - 팔로우 제거
 */
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 DB ID 조회
    const { data: currentUserData, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUserData) {
      console.error("사용자 조회 에러:", currentUserError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 팔로우 삭제
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserData.id)
      .eq("following_id", user_id);

    if (deleteError) {
      logError(deleteError, "팔로우 삭제");
      return NextResponse.json(
        { error: getErrorMessage(500, "팔로우 취소에 실패했습니다.") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logError(error, "팔로우 삭제 API");
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

