/**
 * @file components/post/like-button.tsx
 * @description Instagram 스타일 좋아요 버튼 컴포넌트
 *
 * PRD 7.3 좋아요 & 8. 애니메이션 기반
 * - 상태: 빈 하트 ↔ 빨간 하트
 * - 애니메이션: 클릭 시 scale(1.3) → scale(1) (0.15초)
 * - Optimistic UI 업데이트
 */

"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  onLikeChange,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (isLoading) return;

    // Optimistic UI 업데이트
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;

    setIsLiked(newLiked);
    setLikeCount(newCount);
    setIsAnimating(true);

    // 애니메이션 후 리셋
    setTimeout(() => setIsAnimating(false), 300);

    setIsLoading(true);

    try {
      const response = await fetch("/api/likes", {
        method: newLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId }),
      });

      if (!response.ok) {
        // 실패 시 롤백
        setIsLiked(!newLiked);
        setLikeCount(newLiked ? newCount - 1 : newCount + 1);
        console.error("좋아요 처리 실패");
        return;
      }

      // 성공 시 콜백 호출
      onLikeChange?.(newLiked, newCount);
    } catch (error) {
      // 에러 시 롤백
      setIsLiked(!newLiked);
      setLikeCount(newLiked ? newCount - 1 : newCount + 1);
      console.error("좋아요 처리 에러:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, likeCount, isLoading, postId, onLikeChange]);

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "p-1 -ml-1 transition-transform",
        isAnimating && "like-animation"
      )}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
    >
      <Heart
        className={cn(
          "w-6 h-6 transition-colors",
          isLiked
            ? "fill-instagram-like text-instagram-like"
            : "text-instagram hover:text-instagram-secondary"
        )}
        strokeWidth={isLiked ? 0 : 1.5}
      />
    </button>
  );
}

