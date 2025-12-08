/**
 * @file app/api/posts/route.ts
 * @description 게시물 API (GET: 목록 조회)
 *
 * GET /api/posts
 * - 게시물 목록 조회 (시간 역순 정렬)
 * - 페이지네이션 지원 (limit, offset)
 * - userId 파라미터 지원 (프로필 페이지용)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

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
      console.error("게시물 조회 에러:", postsError);
      return NextResponse.json(
        { error: "게시물을 불러오는데 실패했습니다." },
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
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

