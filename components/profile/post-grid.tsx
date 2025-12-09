/**
 * @file components/profile/post-grid.tsx
 * @description Instagram 스타일 게시물 그리드 컴포넌트
 *
 * PRD 4. 프로필 페이지 기반
 * - 3열 그리드 레이아웃 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 표시
 * - 클릭 시 게시물 상세 모달 열기
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import PostModal from "@/components/post/post-modal";
import type { PostWithUser } from "@/lib/types";

interface PostGridProps {
  posts: PostWithUser[];
  userId?: string; // 특정 사용자의 게시물만 (프로필 페이지용)
}

export default function PostGrid({ posts: initialPosts, userId }: PostGridProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts);

  // initialPosts가 변경되면 상태 업데이트
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // 선택된 게시물 찾기
  const selectedPost = selectedPostId
    ? posts.find((p) => p.id === selectedPostId) || null
    : null;

  // 모달 열기 핸들러
  const handleOpenModal = useCallback((postId: string) => {
    setSelectedPostId(postId);
  }, []);

  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setSelectedPostId(null);
  }, []);

  // 이전/다음 게시물로 이동
  const handleNavigate = useCallback((postId: string) => {
    setSelectedPostId(postId);
  }, []);

  // 게시물 삭제 핸들러
  const handleDeletePost = useCallback((postId: string) => {
    // Optimistic UI: 즉시 목록에서 제거
    const deletedPost = posts.find((p) => p.id === postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    // 모달이 열려있고 삭제된 게시물이면 모달 닫기
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    }

    // 실패 시 롤백은 PostModal에서 처리
    // (API 호출이 실패하면 에러 메시지 표시 후 롤백)
  }, [posts, selectedPostId]);

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-instagram-secondary">아직 게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 게시물 그리드 */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square bg-gray-100 cursor-pointer group"
            onClick={() => handleOpenModal(post.id)}
          >
            {/* 썸네일 이미지 */}
            <Image
              src={post.image_url}
              alt={post.caption || "게시물"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 33vw, 210px"
            />

            {/* Hover 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
              {/* 좋아요 수 */}
              <div className="flex items-center gap-2 text-white">
                <Heart className="w-6 h-6 fill-white" strokeWidth={0} />
                <span className="font-semibold">
                  {formatNumber(post.likes_count)}
                </span>
              </div>

              {/* 댓글 수 */}
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="w-6 h-6 fill-white" strokeWidth={0} />
                <span className="font-semibold">
                  {formatNumber(post.comments_count)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 게시물 상세 모달 */}
      <PostModal
        open={selectedPostId !== null}
        onClose={handleCloseModal}
        post={selectedPost}
        posts={posts}
        onNavigate={handleNavigate}
        onDelete={handleDeletePost}
      />
    </>
  );
}

