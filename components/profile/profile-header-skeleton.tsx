/**
 * @file components/profile/profile-header-skeleton.tsx
 * @description 프로필 헤더 로딩 스켈레톤 컴포넌트
 *
 * PRD 8. 애니메이션 & 인터랙션 - 로딩 기반
 * - Skeleton UI (회색 박스 애니메이션)
 * - Shimmer 효과 (globals.css의 skeleton-shimmer 클래스 사용)
 */

import { cn } from "@/lib/utils";

export default function ProfileHeaderSkeleton() {
  return (
    <div
      className="border-b border-instagram pb-8"
      aria-busy="true"
      aria-label="프로필 헤더 로딩 중"
    >
      <div
        className={cn(
          "flex gap-8",
          "flex-col md:flex-row",
          "items-center md:items-start"
        )}
      >
        {/* 프로필 이미지 스켈레톤 */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "rounded-full bg-gray-200 skeleton-shimmer",
              "w-[90px] h-[90px] md:w-[120px] md:h-[120px] lg:w-[150px] lg:h-[150px]"
            )}
          />
        </div>

        {/* 프로필 정보 스켈레톤 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명과 액션 버튼 스켈레톤 */}
          <div className="flex items-center gap-4 mb-4">
            {/* 사용자명 */}
            <div className="h-7 w-32 bg-gray-200 rounded skeleton-shimmer md:h-8" />
            {/* 버튼 */}
            <div className="h-8 w-24 bg-gray-200 rounded-lg skeleton-shimmer" />
          </div>

          {/* 통계 스켈레톤 */}
          <div className="flex items-center gap-6 mb-4">
            {/* 게시물 수 */}
            <div className="flex items-center gap-1">
              <div className="h-5 w-8 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-4 w-12 bg-gray-200 rounded skeleton-shimmer" />
            </div>
            {/* 팔로워 수 */}
            <div className="flex items-center gap-1">
              <div className="h-5 w-8 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-4 w-16 bg-gray-200 rounded skeleton-shimmer" />
            </div>
            {/* 팔로잉 수 */}
            <div className="flex items-center gap-1">
              <div className="h-5 w-8 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-4 w-16 bg-gray-200 rounded skeleton-shimmer" />
            </div>
          </div>

          {/* 사용자명 (Mobile에서만 표시) 스켈레톤 */}
          <div className="md:hidden">
            <div className="h-5 w-32 bg-gray-200 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

