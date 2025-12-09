/**
 * @file app/(main)/profile/[userId]/page.tsx
 * @description 프로필 페이지 (동적 라우트)
 *
 * PRD 4. 프로필 페이지 & 7.5 프로필 기반
 * - /profile/[userId] - 다른 사용자 프로필
 * - 본인 프로필도 동일한 페이지 사용
 */

import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import ProfileHeader from "@/components/profile/profile-header";
import PostGrid from "@/components/profile/post-grid";
import type { PostWithUser } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  if (!userId) {
    notFound();
  }

  const supabase = createClerkSupabaseClient();
  const { userId: clerkUserId } = await auth();

  // 사용자 정보 조회
  const { data: userStats, error: userStatsError } = await supabase
    .from("user_stats")
    .select("user_id, clerk_id, name, posts_count, followers_count, following_count")
    .eq("user_id", userId)
    .single();

  if (userStatsError || !userStats) {
    notFound();
  }

  // Clerk에서 프로필 이미지 가져오기
  let profileImageUrl: string | undefined;
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userStats.clerk_id);
    profileImageUrl = clerkUser.imageUrl;
  } catch (error) {
    console.error("Clerk 사용자 정보 조회 에러:", error);
    // 에러가 발생해도 계속 진행 (프로필 이미지는 선택사항)
  }

  // 현재 로그인한 사용자 정보 (팔로우 상태 확인용)
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

  // 게시물 목록 조회 (해당 사용자의 게시물만)
  const { data: postsData, error: postsError } = await supabase
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
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("게시물 조회 에러:", postsError);
  }

  // 사용자 정보 조회 (게시물 작성자)
  const { data: userData } = await supabase
    .from("users")
    .select("id, clerk_id, name, created_at")
    .eq("id", userId)
    .single();

  // 현재 사용자의 좋아요 상태 조회
  let likedPostIds: Set<string> = new Set();
  if (currentDbUserId && postsData && postsData.length > 0) {
    const postIds = postsData.map((p) => p.post_id);
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentDbUserId)
      .in("post_id", postIds);

    likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
  }

  // PostWithUser 형식으로 변환
  const posts: PostWithUser[] =
    postsData?.map((post) => ({
      id: post.post_id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      updated_at: post.created_at, // post_stats 뷰에는 updated_at이 없음
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      user: userData
        ? {
            id: userData.id,
            clerk_id: userData.clerk_id,
            name: userData.name,
            created_at: userData.created_at,
          }
        : {
            id: userId,
            clerk_id: userStats.clerk_id,
            name: userStats.name,
            created_at: new Date().toISOString(),
          },
      is_liked: likedPostIds.has(post.post_id),
    })) || [];

  return (
    <div className="max-w-[935px] mx-auto">
      {/* 프로필 헤더 */}
      <ProfileHeader
        userId={userStats.user_id}
        name={userStats.name}
        postsCount={userStats.posts_count || 0}
        followersCount={userStats.followers_count || 0}
        followingCount={userStats.following_count || 0}
        isFollowing={isFollowing}
        isOwnProfile={isOwnProfile}
        profileImageUrl={profileImageUrl}
        onFollowChange={() => {
          // 팔로우 상태 변경 시 통계는 ProfileHeader에서 Optimistic UI로 처리됨
        }}
      />

      {/* 게시물 그리드 */}
      <section className="mt-8" aria-label={`${userStats.name}님의 게시물`}>
        <PostGrid posts={posts} userId={userId} />
      </section>
    </div>
  );
}

