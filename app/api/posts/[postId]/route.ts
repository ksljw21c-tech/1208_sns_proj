/**
 * @file app/api/posts/[postId]/route.ts
 * @description 게시물 삭제 API
 *
 * DELETE /api/posts/[postId]
 * - 게시물 삭제 (본인만)
 * - Supabase Storage에서 이미지도 함께 삭제
 * - CASCADE로 인해 likes, comments도 자동 삭제됨
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage, logError, extractErrorInfo } from "@/lib/utils/error-handler";

/**
 * DELETE /api/posts/[postId] - 게시물 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 동적 라우트 파라미터 추출
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 DB ID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      logError(userError, "사용자 조회");
      return NextResponse.json(
        { error: getErrorMessage(404, "사용자를 찾을 수 없습니다.") },
        { status: 404 }
      );
    }

    // 게시물 존재 및 소유권 확인
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 게시물인지 확인
    if (postData.user_id !== userData.id) {
      return NextResponse.json(
        { error: "본인의 게시물만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // Supabase Storage에서 이미지 삭제
    if (postData.image_url) {
      try {
        // Storage URL에서 경로 추출
        // URL 형식: https://[project].supabase.co/storage/v1/object/public/uploads/[clerk_id]/posts/[filename]
        const urlParts = postData.image_url.split("/uploads/");
        if (urlParts.length > 1) {
          const storagePath = urlParts[1]; // clerk_id/posts/filename 형식

          const { error: storageError } = await supabase.storage
            .from("uploads")
            .remove([storagePath]);

          if (storageError) {
            logError(storageError, "Storage 이미지 삭제");
            // Storage 삭제 실패해도 DB 삭제는 진행 (이미지만 남을 수 있음)
          }
        }
      } catch (storageErr) {
        logError(storageErr, "Storage 경로 추출/삭제");
        // Storage 삭제 실패해도 DB 삭제는 진행
      }
    }

    // 게시물 삭제 (CASCADE로 인해 likes, comments도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      logError(deleteError, "게시물 삭제");
      return NextResponse.json(
        { error: getErrorMessage(500, "게시물 삭제에 실패했습니다.") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logError(error, "게시물 삭제 API");
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

