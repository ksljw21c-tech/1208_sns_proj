/**
 * @file app/(main)/profile/[userId]/loading.tsx
 * @description 프로필 페이지 로딩 상태
 *
 * Next.js 15의 loading.tsx 파일
 * - 프로필 페이지 데이터 로딩 중 자동으로 표시됨
 * - Suspense 경계로 자동 감싸짐
 */

import ProfileHeaderSkeleton from "@/components/profile/profile-header-skeleton";
import PostGridSkeleton from "@/components/profile/post-grid-skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-[935px] mx-auto">
      {/* 프로필 헤더 스켈레톤 */}
      <ProfileHeaderSkeleton />

      {/* 게시물 그리드 스켈레톤 */}
      <div className="mt-8">
        <PostGridSkeleton />
      </div>
    </div>
  );
}

