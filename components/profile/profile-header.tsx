/**
 * @file components/profile/profile-header.tsx
 * @description Instagram 스타일 프로필 헤더 컴포넌트
 *
 * PRD 4. 프로필 페이지 기반
 * - 프로필 이미지 (150px Desktop / 90px Mobile)
 * - 사용자명
 * - 통계 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 팔로우/팔로잉 버튼 (다른 사람 프로필)
 * - 프로필 편집 버튼 (본인 프로필, 1차 제외)
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";

interface ProfileHeaderProps {
  userId: string;
  name: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  profileImageUrl?: string;
  onFollowChange?: (isFollowing: boolean, newFollowersCount: number) => void;
}

export default function ProfileHeader({
  userId,
  name,
  postsCount,
  followersCount,
  followingCount,
  isFollowing = false,
  isOwnProfile = false,
  profileImageUrl,
  onFollowChange,
}: ProfileHeaderProps) {
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [followersCountState, setFollowersCountState] = useState(followersCount);
  const [isLoading, setIsLoading] = useState(false);

  // prop 변경 시 상태 동기화 (다른 페이지에서 팔로우 변경 후 돌아왔을 때)
  useEffect(() => {
    setIsFollowingState(isFollowing);
    setFollowersCountState(followersCount);
  }, [isFollowing, followersCount]);

  // 팔로우/언팔로우 핸들러
  const handleFollow = useCallback(async () => {
    if (isLoading || isOwnProfile) return;

    setIsLoading(true);

    // Optimistic UI 업데이트
    const newFollowing = !isFollowingState;
    const newFollowersCount = newFollowing
      ? followersCountState + 1
      : followersCountState - 1;

    setIsFollowingState(newFollowing);
    setFollowersCountState(newFollowersCount);

    try {
      const response = await fetch("/api/follows", {
        method: newFollowing ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        // 실패 시 롤백
        setIsFollowingState(!newFollowing);
        setFollowersCountState(
          newFollowing ? newFollowersCount - 1 : newFollowersCount + 1
        );
        
        // 에러 메시지 로깅
        const errorData = await response.json().catch(() => ({}));
        console.error("팔로우 API 에러:", errorData.error || "알 수 없는 에러");
        return;
      }

      // 성공 시 콜백 호출
      onFollowChange?.(newFollowing, newFollowersCount);

      // 성공 로깅 (개발 환경에서 동작 확인용)
      console.group("팔로우 기능 동작 확인");
      console.log("✅ 팔로우 상태 변경 성공");
      console.log("변경 전 상태:", {
        isFollowing: isFollowingState,
        followersCount: followersCountState,
      });
      console.log("변경 후 상태:", {
        isFollowing: newFollowing,
        followersCount: newFollowersCount,
      });
      console.log("통계 업데이트:", {
        팔로워수변경: newFollowing ? "+1" : "-1",
        현재팔로워수: newFollowersCount,
      });
      console.groupEnd();
    } catch (error) {
      // 에러 시 롤백
      setIsFollowingState(!newFollowing);
      setFollowersCountState(
        newFollowing ? newFollowersCount - 1 : newFollowersCount + 1
      );
      console.error("팔로우 처리 에러:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    isOwnProfile,
    isFollowingState,
    followersCountState,
    userId,
    onFollowChange,
  ]);

  return (
    <div className="border-b border-instagram pb-8">
      <div
        className={cn(
          "flex gap-8",
          "flex-col md:flex-row",
          "items-center md:items-start"
        )}
      >
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={name}
              className={cn(
                "rounded-full object-cover",
                "w-[90px] h-[90px] md:w-[120px] md:h-[120px] lg:w-[150px] lg:h-[150px]"
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px]",
                "w-[90px] h-[90px] md:w-[120px] md:h-[120px] lg:w-[150px] lg:h-[150px]"
              )}
            >
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-500">
                  {name?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명과 액션 버튼 */}
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-light">{name}</h1>

            {/* 액션 버튼 */}
            {isOwnProfile ? (
              // 본인 프로필: 프로필 편집 버튼 (1차 제외)
              <button
                className="px-4 py-1.5 text-sm font-semibold border border-instagram rounded-lg hover:bg-gray-50 transition-colors"
                disabled
                aria-label="프로필 편집"
              >
                프로필 편집
              </button>
            ) : (
              // 다른 사람 프로필: 팔로우/팔로잉 버튼
              <button
                onClick={handleFollow}
                disabled={isLoading}
                className={cn(
                  "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isFollowingState
                    ? "bg-gray-200 text-instagram hover:border-red-500 hover:border-2 hover:bg-white hover:text-red-500"
                    : "btn-instagram text-white"
                )}
                aria-label={isFollowingState ? "언팔로우" : "팔로우"}
              >
                {isLoading
                  ? "처리 중..."
                  : isFollowingState
                    ? "팔로잉"
                    : "팔로우"}
              </button>
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{formatNumber(postsCount)}</span>
              <span className="text-instagram-secondary">게시물</span>
            </div>
            <button className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <span className="font-semibold">
                {formatNumber(followersCountState)}
              </span>
              <span className="text-instagram-secondary">팔로워</span>
            </button>
            <button className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <span className="font-semibold">
                {formatNumber(followingCount)}
              </span>
              <span className="text-instagram-secondary">팔로잉</span>
            </button>
          </div>

          {/* 사용자명 (Mobile에서만 표시) */}
          <div className="md:hidden">
            <p className="font-semibold">{name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

