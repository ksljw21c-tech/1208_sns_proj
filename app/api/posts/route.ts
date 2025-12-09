/**
 * @file app/api/posts/route.ts
 * @description 게시물 API (GET: 목록 조회, POST: 게시물 생성)
 *
 * GET /api/posts
 * - 게시물 목록 조회 (시간 역순 정렬)
 * - 페이지네이션 지원 (limit, offset)
 * - userId 파라미터 지원 (프로필 페이지용)
 *
 * POST /api/posts
 * - 게시물 생성 (이미지 업로드 + 캡션)
 * - FormData로 이미지 + 캡션 수신
 * - 이미지 검증: 타입 (image/*), 크기 (최대 5MB)
 * - Supabase Storage 업로드
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage, logError, extractErrorInfo } from "@/lib/utils/error-handler";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId"); // 특정 사용자의 게시물만

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 로그인한 사용자 정보 (좋아요 상태 확인용)
    const { userId: clerkUserId } = await auth();
    let currentDbUserId: string | null = null;

    if (clerkUserId) {
      // Clerk ID로 DB 사용자 ID 조회
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      currentDbUserId = currentUserData?.id || null;
    }

    // 게시물 조회 쿼리 (post_stats 뷰 사용)
    let query = supabase
      .from("post_stats")
      .select(
        `
        post_id,
        user_id,
        image_url,
        caption,
        created_at,
        likes_count,
        comments_count
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 특정 사용자의 게시물만 조회
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      logError(postsError, "게시물 조회");
      return NextResponse.json(
        { error: getErrorMessage(500, "게시물을 불러오는데 실패했습니다.") },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 사용자 정보 조회 (게시물 작성자들)
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .in("id", userIds);

    if (usersError) {
      console.error("사용자 조회 에러:", usersError);
    }

    // 사용자 맵 생성
    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    // 현재 사용자의 좋아요 상태 조회
    let likedPostIds: Set<string> = new Set();
    if (currentDbUserId) {
      const postIds = posts.map((p) => p.post_id);
      const { data: likes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", currentDbUserId)
        .in("post_id", postIds);

      likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
    }

    // 응답 데이터 구성
    const postsWithUser = posts.map((post) => ({
      id: post.post_id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      updated_at: post.created_at, // post_stats 뷰에는 updated_at이 없음
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      user: userMap.get(post.user_id) || {
        id: post.user_id,
        clerk_id: "",
        name: "Unknown",
      },
      is_liked: likedPostIds.has(post.post_id),
    }));

    return NextResponse.json({ data: postsWithUser });
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logError(error, "게시물 목록 조회 API");
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

/**
 * POST /api/posts - 게시물 생성
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

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const caption = formData.get("caption") as string || "";

    // 이미지 검증
    if (!imageFile) {
      return NextResponse.json(
        { error: "이미지를 선택해주세요." },
        { status: 400 }
      );
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 가능)" },
        { status: 400 }
      );
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "이미지 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 캡션 길이 검증
    if (caption.length > 2200) {
      return NextResponse.json(
        { error: "캡션은 2,200자 이하여야 합니다." },
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

    // 이미지 파일을 ArrayBuffer로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 파일명 생성 (timestamp + 원본 파일명)
    const timestamp = Date.now();
    const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${clerkUserId}/posts/${timestamp}_${safeFileName}`;

    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(storagePath, buffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      logError(uploadError, "이미지 업로드");
      return NextResponse.json(
        { error: getErrorMessage(500, "이미지 업로드에 실패했습니다.") },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(storagePath);

    const imageUrl = urlData.publicUrl;

    // posts 테이블에 레코드 삽입
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userData.id,
        image_url: imageUrl,
        caption: caption || null,
      })
      .select()
      .single();

    if (postError) {
      logError(postError, "게시물 생성");
      // 업로드된 이미지 삭제 (롤백)
      await supabase.storage.from("uploads").remove([storagePath]).catch(() => {
        // Storage 삭제 실패는 무시
      });
      return NextResponse.json(
        { error: getErrorMessage(500, "게시물 생성에 실패했습니다.") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: postData,
    });
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logError(error, "게시물 생성 API");
    return NextResponse.json(
      { error: errorInfo.message },
      { status: errorInfo.statusCode || 500 }
    );
  }
}

