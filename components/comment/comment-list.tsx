/**
 * @file components/comment/comment-list.tsx
 * @description 댓글 목록 컴포넌트
 *
 * PRD 7.4 댓글 기반
 * - preview 모드: PostCard용, 최신 2개만 표시
 * - full 모드: 상세 모달용, 전체 댓글 + 스크롤
 * - 삭제 버튼: 본인 댓글만 표시
 */

"use client";

import { useCallback } from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentWithUser } from "@/lib/types";

interface CommentListProps {
  comments: CommentWithUser[];
  mode?: "preview" | "full";
  onDelete?: (commentId: string) => void;
  isDeleting?: string | null; // 삭제 중인 댓글 ID
}

export default function CommentList({
  comments,
  mode = "preview",
  onDelete,
  isDeleting,
}: CommentListProps) {
  const { user } = useUser();

  // preview 모드: 최신 2개만
  const displayComments = mode === "preview" ? comments.slice(0, 2) : comments;

  const handleDelete = useCallback(
    (commentId: string) => {
      if (onDelete) {
        onDelete(commentId);
      }
    },
    [onDelete]
  );

  if (displayComments.length === 0) {
    return null;
  }

  return (
    <div className={mode === "full" ? "space-y-3" : "space-y-1"}>
      {displayComments.map((comment) => {
        // 현재 사용자가 댓글 작성자인지 확인 (clerk_id로 비교)
        const isOwner = user?.id === comment.user.clerk_id;
        const isCurrentlyDeleting = isDeleting === comment.id;

        return (
          <div
            key={comment.id}
            className={`group flex items-start gap-2 ${
              isCurrentlyDeleting ? "opacity-50" : ""
            }`}
          >
            {/* 댓글 내용 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-semibold mr-1 hover:underline"
                >
                  {comment.user.name}
                </Link>
                <span className="break-words">{comment.content}</span>
              </p>

              {/* full 모드에서만 시간 표시 */}
              {mode === "full" && (
                <p className="text-xs text-instagram-secondary mt-1">
                  {formatRelativeTime(comment.created_at)}
                </p>
              )}
            </div>

            {/* 삭제 버튼 (본인 댓글만, full 모드에서만) */}
            {mode === "full" && isOwner && (
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={isCurrentlyDeleting}
                className="opacity-0 group-hover:opacity-100 p-1 text-instagram-secondary hover:text-red-500 transition-all"
                aria-label="댓글 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

