/**
 * @file components/comment/comment-form.tsx
 * @description 댓글 입력 폼 컴포넌트
 *
 * PRD 7.4 댓글 기반
 * - 댓글 입력 필드 ("댓글 달기...")
 * - Enter 키 또는 "게시" 버튼으로 제출
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  postId: string;
  onSubmit: (content: string) => Promise<void>;
  isSubmitting?: boolean;
  autoFocus?: boolean;
}

export default function CommentForm({
  onSubmit,
  isSubmitting = false,
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // autoFocus 처리
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmedContent = content.trim();
      if (!trimmedContent || isSubmitting) return;

      try {
        await onSubmit(trimmedContent);
        setContent(""); // 성공 시 입력 초기화
      } catch (error) {
        // 에러는 상위에서 처리
        console.error("댓글 작성 에러:", error);
      }
    },
    [content, isSubmitting, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const inputId = `comment-input-${Date.now()}`;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        댓글 입력
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="댓글 달기..."
        disabled={isSubmitting}
        aria-label="댓글 입력"
        aria-required="false"
        className={cn(
          "flex-1 text-sm bg-transparent outline-none",
          "placeholder:text-instagram-secondary",
          "focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2",
          isSubmitting && "opacity-50"
        )}
        maxLength={500}
      />

      {/* 게시 버튼 - 내용이 있을 때만 표시 */}
      {content.trim().length > 0 && (
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "text-sm font-semibold transition-opacity",
            canSubmit
              ? "text-instagram-blue hover:text-blue-700"
              : "text-instagram-blue/50 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "게시"
          )}
        </button>
      )}
    </form>
  );
}

