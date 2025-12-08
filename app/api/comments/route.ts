/**
 * @file app/api/comments/route.ts
 * @description 댓글 API (GET: 조회, POST: 작성, DELETE: 삭제)
 *
 * GET /api/comments?post_id={id}&limit={n}
 * - 특정 게시물의 댓글 목록 조회
 *
 * POST /api/comments
 * - 댓글 작성
 * - 요청: { post_id, content }
 *
 * DELETE /api/comments
 * - 댓글 삭제 (본인만)
 * - 요청: { comment_id }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/comments - 댓글 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!postId) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 댓글 조회
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at, updated_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (commentsError) {
      console.error("댓글 조회 에러:", commentsError);
      return NextResponse.json(
        { error: "댓글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 사용자 정보 조회
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .in("id", userIds);

    if (usersError) {
      console.error("사용자 조회 에러:", usersError);
    }

    // 사용자 맵 생성
    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    // 응답 데이터 구성
    const commentsWithUser = comments.map((comment) => ({
      ...comment,
      user: userMap.get(comment.user_id) || {
        id: comment.user_id,
        clerk_id: "",
        name: "Unknown",
      },
    }));

    return NextResponse.json({ data: commentsWithUser });
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments - 댓글 작성
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
    const { post_id, content } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "댓글은 500자 이하여야 합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 DB ID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 에러:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 게시물 존재 확인
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !postData) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 작성
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: userData.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error("댓글 작성 에러:", commentError);
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 응답에 사용자 정보 포함
    return NextResponse.json({
      success: true,
      data: {
        ...commentData,
        user: userData,
      },
    });
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments - 댓글 삭제
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
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: "댓글 ID가 필요합니다." },
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
      console.error("사용자 조회 에러:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 존재 및 소유권 확인
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", comment_id)
      .single();

    if (commentError || !commentData) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 댓글인지 확인
    if (commentData.user_id !== userData.id) {
      return NextResponse.json(
        { error: "본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment_id);

    if (deleteError) {
      console.error("댓글 삭제 에러:", deleteError);
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

