/**
 * @file components/post/post-card.tsx
 * @description Instagram 스타일 게시물 카드 컴포넌트
 *
 * PRD 3. PostCard 디자인 기반
 * - 헤더 (60px): 프로필 32px, 사용자명 Bold, 시간, ⋯ 메뉴
 * - 이미지: 1:1 정사각형, 더블탭 좋아요
 * - 액션버튼 (48px): 좋아요, 댓글, (공유/북마크 UI만)
 * - 좋아요 수 Bold
 * - 캡션: 사용자명 Bold + 내용, 2줄 초과 시 "... 더 보기"
 * - 댓글 미리보기: 최신 2개
 * - 댓글 작성 폼
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, MessageCircle, Send, Bookmark, Heart, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn, formatRelativeTime, formatNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LikeButton from "./like-button";
import CommentList from "@/components/comment/comment-list";
import CommentForm from "@/components/comment/comment-form";
import type { PostWithUser, CommentWithUser } from "@/lib/types";

interface PostCardProps {
  post: PostWithUser;
  comments?: CommentWithUser[];
  onCommentClick?: () => void;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, comments: initialComments = [], onCommentClick, onDelete }: PostCardProps) {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const lastTapRef = useRef<number>(0);
  const singleClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 본인 게시물인지 확인
  const isOwner = user?.id === post.user.clerk_id;

  // 더블탭 감지 및 좋아요 처리
  const handleImageClick = useCallback(async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지 - 단일 클릭 타이머 취소
      if (singleClickTimerRef.current) {
        clearTimeout(singleClickTimerRef.current);
        singleClickTimerRef.current = null;
      }

      // 더블탭 좋아요 처리
      if (!isLiked) {
        // 좋아요 추가
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);

        try {
          await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: post.id }),
          });
        } catch (error) {
          // 실패 시 롤백
          setIsLiked(false);
          setLikeCount((prev) => prev - 1);
          console.error("더블탭 좋아요 에러:", error);
        }
      }

      // 큰 하트 애니메이션 표시
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
    } else {
      // 단일 클릭 - 더블탭인지 확인하기 위해 잠시 대기
      if (singleClickTimerRef.current) {
        clearTimeout(singleClickTimerRef.current);
      }
      singleClickTimerRef.current = setTimeout(() => {
        // 더블탭이 아니면 모달 열기
        if (onCommentClick) {
          onCommentClick();
        }
        singleClickTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }

    lastTapRef.current = now;
  }, [isLiked, post.id, onCommentClick]);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((liked: boolean, count: number) => {
    setIsLiked(liked);
    setLikeCount(count);
  }, []);

  // 댓글 작성 핸들러
  const handleCommentSubmit = useCallback(
    async (content: string) => {
      setIsSubmittingComment(true);

      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: post.id, content }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "댓글 작성에 실패했습니다.");
        }

        const { data: newComment } = await response.json();

        // 댓글 목록에 추가 (최신 댓글이 뒤에)
        setComments((prev) => [...prev, newComment]);
        setCommentCount((prev) => prev + 1);
      } catch (error) {
        console.error("댓글 작성 에러:", error);
        throw error; // CommentForm에서 에러 처리하도록
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [post.id]
  );

  // 댓글 삭제 핸들러
  const handleCommentDelete = useCallback(async (commentId: string) => {
    setDeletingCommentId(commentId);

    // Optimistic UI - 먼저 목록에서 제거
    const deletedComment = comments.find((c) => c.id === commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((prev) => prev - 1);

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!response.ok) {
        // 실패 시 롤백
        if (deletedComment) {
          setComments((prev) => [...prev, deletedComment]);
          setCommentCount((prev) => prev + 1);
        }
        console.error("댓글 삭제 실패");
      }
    } catch (error) {
      // 에러 시 롤백
      if (deletedComment) {
        setComments((prev) => [...prev, deletedComment]);
        setCommentCount((prev) => prev + 1);
      }
      console.error("댓글 삭제 에러:", error);
    } finally {
      setDeletingCommentId(null);
    }
  }, [comments]);

  // 게시물 삭제 핸들러
  const handleDeletePost = useCallback(async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "게시물 삭제에 실패했습니다.");
      }

      // 성공 시 다이얼로그 닫기 및 부모 컴포넌트에 알림
      setShowDeleteDialog(false);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error("게시물 삭제 에러:", error);
      alert(error instanceof Error ? error.message : "게시물 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }, [post.id, onDelete]);

  // 캡션이 긴지 확인 (대략 100자 이상)
  const isLongCaption = post.caption && post.caption.length > 100;

  return (
    <article className="bg-white border border-instagram rounded-lg overflow-hidden">
      {/* 헤더 */}
      <header className="flex items-center justify-between p-3 h-[60px]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 */}
          <Link href={`/profile/${post.user.id}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500">
                  {post.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
            </div>
          </Link>

          {/* 사용자명 + 시간 */}
          <div className="flex flex-col">
            <Link
              href={`/profile/${post.user.id}`}
              className="text-sm font-semibold text-instagram hover:underline"
            >
              {post.user.name}
            </Link>
          </div>
        </div>

        {/* 시간 + 더보기 메뉴 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-instagram-secondary">
            {formatRelativeTime(post.created_at)}
          </span>
          {isOwner && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="더보기"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 이미지 영역 */}
      <div
        className="relative aspect-square bg-gray-100 cursor-pointer"
        onClick={handleImageClick}
      >
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false}
        />

        {/* 더블탭 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className="w-24 h-24 text-white fill-white heart-animation drop-shadow-lg"
              strokeWidth={0}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between p-3 h-[48px]">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <LikeButton
            postId={post.id}
            initialLiked={isLiked}
            initialCount={likeCount}
            onLikeChange={handleLikeChange}
          />

          {/* 댓글 버튼 */}
          <button
            onClick={onCommentClick}
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
          </button>

          {/* 공유 버튼 (UI만) */}
          <button
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="공유"
          >
            <Send className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* 북마크 버튼 (UI만) */}
        <button
          className="p-1 hover:opacity-70 transition-opacity"
          aria-label="저장"
        >
          <Bookmark className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* 좋아요 수 */}
      <div className="px-3 pb-1">
        <p className="text-sm font-semibold">
          좋아요 {formatNumber(likeCount)}개
        </p>
      </div>

      {/* 캡션 */}
      {post.caption && (
        <div className="px-3 pb-2">
          <p className="text-sm">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold mr-1 hover:underline"
            >
              {post.user.name}
            </Link>
            {showFullCaption || !isLongCaption ? (
              post.caption
            ) : (
              <>
                {post.caption.slice(0, 100)}...
                <button
                  onClick={() => setShowFullCaption(true)}
                  className="text-instagram-secondary ml-1"
                >
                  더 보기
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {/* 댓글 미리보기 */}
      {commentCount > 0 && (
        <div className="px-3 pb-2">
          {/* 전체 댓글 보기 링크 */}
          {commentCount > 2 && (
            <button
              onClick={onCommentClick}
              className="text-sm text-instagram-secondary mb-1"
            >
              댓글 {formatNumber(commentCount)}개 모두 보기
            </button>
          )}

          {/* 최신 댓글 2개 미리보기 */}
          <CommentList
            comments={comments.slice(-2)} // 최신 2개 (맨 뒤 2개)
            mode="preview"
          />
        </div>
      )}

      {/* 댓글 작성 폼 */}
      <div className="px-3 py-3 border-t border-instagram">
        <CommentForm
          postId={post.id}
          onSubmit={handleCommentSubmit}
          isSubmitting={isSubmittingComment}
        />
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
            <DialogDescription>
              정말 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
