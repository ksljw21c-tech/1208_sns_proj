/**
 * @file components/post/post-modal.tsx
 * @description Instagram 스타일 게시물 상세 모달 컴포넌트
 *
 * PRD 5. 게시물 상세 모달 기반
 * - Desktop: 모달 형식 (이미지 50% + 댓글 50%)
 * - Mobile: 전체 페이지로 전환 또는 전체 화면 모달
 * - 닫기 버튼 (✕)
 * - 이전/다음 게시물 네비게이션 (Desktop)
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal, MessageCircle, Send, Bookmark, Heart } from "lucide-react";
import { useUser } from "@clerk/nextjs";
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
import { cn, formatNumber } from "@/lib/utils";
import { extractErrorInfo } from "@/lib/utils/error-handler";
import { useToastContext } from "@/components/providers/toast-provider";
import { apiFetch } from "@/lib/utils/api-client";
import type { PostWithUser, CommentWithUser } from "@/lib/types";

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  post: PostWithUser | null;
  posts?: PostWithUser[]; // 이전/다음 네비게이션용
  onNavigate?: (postId: string) => void; // 이전/다음 게시물로 이동
  onDelete?: (postId: string) => void; // 게시물 삭제 콜백
}

export default function PostModal({
  open,
  onClose,
  post,
  posts = [],
  onNavigate,
  onDelete,
}: PostModalProps) {
  const { user } = useUser();
  const { showError } = useToastContext();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const lastTapRef = useRef<number>(0);
  const commentScrollRef = useRef<HTMLDivElement>(null);

  // 본인 게시물인지 확인
  const isOwner = post ? user?.id === post.user.clerk_id : false;

  // 게시물이 변경될 때 상태 초기화
  useEffect(() => {
    if (post) {
      setIsLiked(post.is_liked || false);
      setLikeCount(post.likes_count);
      setCommentCount(post.comments_count);
      setComments([]);
      setIsLoadingComments(true);
    }
  }, [post]);

  // 댓글 목록 로드
  useEffect(() => {
    if (!post || !open) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await apiFetch(`/api/comments?post_id=${post.id}&limit=100`);
        const data = await response.json();
        setComments(data.data || []);
      } catch (error) {
        const errorInfo = extractErrorInfo(error);
        console.error("댓글 로드 에러:", errorInfo.message);
        showError(errorInfo.message);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [post, open, showError]);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((liked: boolean, count: number) => {
    setIsLiked(liked);
    setLikeCount(count);
  }, []); // showError는 사용하지 않으므로 의존성 배열에 포함하지 않음

  // 더블탭 감지 및 좋아요 처리
  const handleImageDoubleTap = useCallback(async () => {
    if (!post) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      if (!isLiked) {
        // 좋아요 추가
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);

        try {
          await apiFetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: post.id }),
          });
        } catch (error) {
          // 실패 시 롤백
          setIsLiked(false);
          setLikeCount((prev) => prev - 1);
          const errorInfo = extractErrorInfo(error);
          showError(errorInfo.message);
        }
      }

      // 큰 하트 애니메이션 표시
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
    }

    lastTapRef.current = now;
  }, [isLiked, post, showError]);

  // 댓글 작성 핸들러
  const handleCommentSubmit = useCallback(
    async (content: string) => {
      if (!post) return;

      setIsSubmittingComment(true);

      try {
        const response = await apiFetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: post.id, content }),
        });

        const data = await response.json();
        const newComment = data.data;

        // 댓글 목록에 추가
        setComments((prev) => [...prev, newComment]);
        setCommentCount((prev) => prev + 1);

        // 댓글 영역 스크롤을 맨 아래로
        setTimeout(() => {
          if (commentScrollRef.current) {
            commentScrollRef.current.scrollTop = commentScrollRef.current.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error("댓글 작성 에러:", error);
        throw error; // CommentForm에서 에러 처리하도록
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [post] // showError는 사용하지 않으므로 의존성 배열에 포함하지 않음
  );

  // 댓글 삭제 핸들러
  const handleCommentDelete = useCallback(async (commentId: string) => {
    setDeletingCommentId(commentId);

    // Optimistic UI - 먼저 목록에서 제거
    const deletedComment = comments.find((c) => c.id === commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((prev) => prev - 1);

    try {
      await apiFetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });
    } catch (error) {
      // 에러 시 롤백
      if (deletedComment) {
        setComments((prev) => [...prev, deletedComment]);
        setCommentCount((prev) => prev + 1);
      }
      const errorInfo = extractErrorInfo(error);
      console.error("댓글 삭제 에러:", error);
      showError(errorInfo.message);
    } finally {
      setDeletingCommentId(null);
    }
  }, [comments, showError]); // showError는 사용하므로 의존성 배열에 포함

  // 이전/다음 게시물 찾기
  const currentIndex = post ? posts.findIndex((p) => p.id === post.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < posts.length - 1;

  // 이전 게시물로 이동
  const handlePrevious = useCallback(() => {
    if (hasPrevious && onNavigate) {
      const previousPost = posts[currentIndex - 1];
      onNavigate(previousPost.id);
    }
  }, [hasPrevious, onNavigate, posts, currentIndex]);

  // 다음 게시물로 이동
  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) {
      const nextPost = posts[currentIndex + 1];
      onNavigate(nextPost.id);
    }
  }, [hasNext, onNavigate, posts, currentIndex]);

  // 게시물 삭제 핸들러
  const handleDeletePost = useCallback(async () => {
    if (!post) return;

    setIsDeleting(true);

    try {
      await apiFetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      // 성공 시 다이얼로그 닫기, 모달 닫기 및 부모 컴포넌트에 알림
      setShowDeleteDialog(false);
      onClose();
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      console.error("게시물 삭제 에러:", error);
      showError(errorInfo.message);
    } finally {
      setIsDeleting(false);
    }
  }, [post, onClose, onDelete, showError]);

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden",
          "max-w-[900px] h-[600px]",
          "lg:flex lg:flex-row",
          "max-lg:w-full max-lg:h-full max-lg:max-w-full max-lg:flex-col"
        )}
      >
        {/* 이미지 영역 */}
        <div
          className={cn(
            "relative bg-black",
            "lg:w-1/2 lg:h-full",
            "max-lg:w-full max-lg:h-1/2"
          )}
        >
          <div
            className="relative w-full h-full cursor-pointer"
            onClick={handleImageDoubleTap}
          >
            <Image
              src={post.image_url}
              alt={post.caption || "게시물 이미지"}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 450px"
              priority={open}
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

          {/* 이전/다음 네비게이션 버튼 (Desktop만) */}
          {hasPrevious && (
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors lg:block hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="이전 게시물"
            >
              <ChevronLeft className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors lg:block hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="다음 게시물"
            >
              <ChevronRight className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* 댓글 영역 */}
        <div
          className={cn(
            "flex flex-col bg-white",
            "lg:w-1/2 lg:h-full",
            "max-lg:w-full max-lg:h-1/2"
          )}
        >
          {/* 헤더 */}
          <header className="flex items-center justify-between p-3 h-[60px] border-b border-instagram">
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

              {/* 사용자명 */}
              <Link
                href={`/profile/${post.user.id}`}
                className="text-sm font-semibold text-instagram hover:underline"
              >
                {post.user.name}
              </Link>
            </div>

            {/* 더보기 메뉴 */}
            {isOwner && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-1 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none rounded"
                aria-label="더보기"
              >
                <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </header>

          {/* 댓글 목록 (스크롤 가능) */}
          <div
            ref={commentScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pb-3 border-b border-instagram">
              <div className="flex items-center gap-4">
                {/* 좋아요 버튼 */}
                <LikeButton
                  postId={post.id}
                  initialLiked={isLiked}
                  initialCount={likeCount}
                  onLikeChange={handleLikeChange}
                />

                {/* 댓글 버튼 (비활성화) */}
                <button
                  className="p-1 opacity-50 cursor-default"
                  aria-label="댓글"
                  disabled
                  aria-disabled="true"
                >
                  <MessageCircle className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                </button>

                {/* 공유 버튼 (UI만) */}
                <button
                  className="p-1 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none rounded"
                  aria-label="공유"
                  disabled
                  aria-disabled="true"
                >
                  <Send className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

              {/* 북마크 버튼 (UI만) */}
              <button
                className="p-1 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none rounded"
                aria-label="저장"
                disabled
                aria-disabled="true"
              >
                <Bookmark className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            {/* 좋아요 수 */}
            <div className="pb-2">
              <p className="text-sm font-semibold">
                좋아요 {formatNumber(likeCount)}개
              </p>
            </div>

            {/* 캡션 */}
            {post.caption && (
              <div className="pb-2">
                <p className="text-sm">
                  <Link
                    href={`/profile/${post.user.id}`}
                    className="font-semibold mr-1 hover:underline"
                  >
                    {post.user.name}
                  </Link>
                  {post.caption}
                </p>
              </div>
            )}

            {/* 댓글 목록 */}
            {isLoadingComments ? (
              <div className="text-center py-8">
                <p className="text-sm text-instagram-secondary">댓글을 불러오는 중...</p>
              </div>
            ) : comments.length > 0 ? (
              <CommentList
                comments={comments}
                mode="full"
                onDelete={handleCommentDelete}
                isDeleting={deletingCommentId}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-instagram-secondary">아직 댓글이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 (하단 고정) */}
          <div className="p-4 border-t border-instagram">
            <CommentForm
              postId={post.id}
              onSubmit={handleCommentSubmit}
              isSubmitting={isSubmittingComment}
              autoFocus={open}
            />
          </div>
        </div>
      </DialogContent>

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
    </Dialog>
  );
}

