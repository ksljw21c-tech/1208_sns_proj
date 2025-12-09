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

import { useState, useCallback, useEffect, memo, useMemo } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import PostModal from "@/components/post/post-modal";
import type { PostWithUser } from "@/lib/types";

interface PostGridProps {
  posts: PostWithUser[];
  userId?: string; // 특정 사용자의 게시물만 (프로필 페이지용)
}

function PostGrid({ posts: initialPosts }: PostGridProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts);

  // initialPosts가 변경되면 상태 업데이트
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // 선택된 게시물 찾기 (useMemo로 최적화)
  const selectedPost = useMemo(
    () => (selectedPostId ? posts.find((p) => p.id === selectedPostId) || null : null),
    [selectedPostId, posts]
  );

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
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    // 모달이 열려있고 삭제된 게시물이면 모달 닫기
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    }

    // 실패 시 롤백은 PostModal에서 처리
    // (API 호출이 실패하면 에러 메시지 표시 후 롤백)
  }, [selectedPostId]);

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div
        className="text-center py-16"
        role="status"
        aria-live="polite"
      >
        <p className="text-instagram-secondary">아직 게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 게시물 그리드 */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            className="relative aspect-square bg-gray-100 cursor-pointer group focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none"
            onClick={() => handleOpenModal(post.id)}
            aria-label={`${post.caption || "게시물"} 보기`}
          >
            {/* 썸네일 이미지 */}
            <Image
              src={post.image_url}
              alt={post.caption || "게시물"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 33vw, 210px"
              loading="lazy"
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
          </button>
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

// props 비교 함수 (성능 최적화)
const areEqual = (prevProps: PostGridProps, nextProps: PostGridProps) => {
  // posts 배열이 같은 길이이고 모든 post.id가 같으면 리렌더링 방지
  if (prevProps.posts.length !== nextProps.posts.length) return false;
  if (prevProps.userId !== nextProps.userId) return false;
  
  return prevProps.posts.every((post, index) => {
    const nextPost = nextProps.posts[index];
    return (
      post.id === nextPost.id &&
      post.likes_count === nextPost.likes_count &&
      post.comments_count === nextPost.comments_count
    );
  });
};

export default memo(PostGrid, areEqual);

