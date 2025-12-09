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
import { extractErrorInfo } from "@/lib/utils/error-handler";
import { useToastContext } from "@/components/providers/toast-provider";
import { apiFetch } from "@/lib/utils/api-client";

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
  const { showError } = useToastContext();
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

    // 애니메이션 후 리셋 (0.15초)
    setTimeout(() => setIsAnimating(false), 150);

    setIsLoading(true);

    try {
      await apiFetch("/api/likes", {
        method: newLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId }),
      });

      // 성공 시 콜백 호출
      onLikeChange?.(newLiked, newCount);
    } catch (error) {
      // 에러 시 롤백
      setIsLiked(!newLiked);
      setLikeCount(newLiked ? newCount - 1 : newCount + 1);
      const errorInfo = extractErrorInfo(error);
      console.error("좋아요 처리 에러:", error);
      showError(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, likeCount, isLoading, postId, onLikeChange, showError]);

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "p-1 -ml-1 transition-transform",
        "focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none rounded",
        isAnimating && "like-animation"
      )}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      aria-pressed={isLiked}
    >
      <Heart
        className={cn(
          "w-6 h-6 transition-colors",
          isLiked
            ? "fill-instagram-like text-instagram-like"
            : "text-instagram hover:text-instagram-secondary"
        )}
        strokeWidth={isLiked ? 0 : 1.5}
        aria-hidden="true"
      />
    </button>
  );
}

