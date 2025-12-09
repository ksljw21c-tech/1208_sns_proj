/**
 * @file components/post/post-feed.tsx
 * @description 게시물 피드 컴포넌트 (무한 스크롤)
 *
 * PRD 8. 애니메이션 & 인터랙션 - 무한 스크롤 기반
 * - Intersection Observer 사용
 * - 하단 도달 시 10개씩 로드
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "./post-card";
import PostCardSkeleton from "./post-card-skeleton";
import PostModal from "./post-modal";
import ErrorMessage from "@/components/ui/error-message";
import { isNetworkError, extractErrorInfo } from "@/lib/utils/error-handler";
import { apiFetch } from "@/lib/utils/api-client";
import type { PostWithUser } from "@/lib/types";

interface PostFeedProps {
  userId?: string; // 특정 사용자의 게시물만 (프로필 페이지용)
  initialPosts?: PostWithUser[];
}

const POSTS_PER_PAGE = 10;

export default function PostFeed({ userId, initialPosts = [] }: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialPosts.length);

  // 게시물 가져오기
  const fetchPosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: POSTS_PER_PAGE.toString(),
        offset: offsetRef.current.toString(),
      });

      if (userId) {
        params.append("userId", userId);
      }

      const response = await apiFetch(`/api/posts?${params}`);
      const data = await response.json();
      const newPosts: PostWithUser[] = data.data || [];

      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      setPosts((prev) => [...prev, ...newPosts]);
      offsetRef.current += newPosts.length;
    } catch (err) {
      const errorInfo = extractErrorInfo(err);
      setError(errorInfo.message);
      console.error("게시물 로드 에러:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, userId]);

  // 초기 로드 (initialPosts가 없을 때)
  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts();
    }
  }, [fetchPosts, initialPosts.length]);

  // Intersection Observer 설정 (무한 스크롤)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchPosts();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchPosts, hasMore, isLoading]);

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
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    // 모달이 열려있고 삭제된 게시물이면 모달 닫기
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    }

    // 실패 시 롤백은 PostCard/PostModal에서 처리
    // (API 호출이 실패하면 에러 메시지 표시 후 롤백)
  }, [selectedPostId]);

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <ErrorMessage
        message={error}
        errorType={isNetworkError(error) ? "network" : "server"}
        onRetry={() => {
          setError(null);
          fetchPosts();
        }}
        className="max-w-2xl mx-auto"
      />
    );
  }

  // 빈 상태
  if (!isLoading && posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-instagram p-6 text-center">
        <p className="text-instagram-secondary">아직 게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 게시물 목록 */}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onCommentClick={() => handleOpenModal(post.id)}
            onDelete={handleDeletePost}
          />
        ))}

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {/* 무한 스크롤 트리거 */}
        {hasMore && (
          <div
            ref={observerRef}
            className="h-4"
            aria-label="더 많은 게시물 로드"
            aria-live="polite"
          />
        )}

        {/* 더 이상 게시물 없음 */}
        {!hasMore && posts.length > 0 && (
          <div
            className="text-center py-8"
            role="status"
            aria-live="polite"
          >
            <p className="text-instagram-secondary text-sm">
              모든 게시물을 확인했습니다.
            </p>
          </div>
        )}
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

