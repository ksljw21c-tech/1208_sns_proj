/**
 * @file components/post/post-card-skeleton.tsx
 * @description PostCard 로딩 스켈레톤 컴포넌트
 *
 * PRD 8. 애니메이션 & 인터랙션 - 로딩 기반
 * - Skeleton UI (회색 박스 애니메이션)
 * - Shimmer 효과 (globals.css의 skeleton-shimmer 클래스 사용)
 */

export default function PostCardSkeleton() {
  return (
    <article
      className="bg-white border border-instagram rounded-lg overflow-hidden"
      aria-busy="true"
      aria-label="게시물 로딩 중"
    >
      {/* 헤더 스켈레톤 */}
      <header className="flex items-center justify-between p-3 h-[60px]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 */}
          <div className="w-8 h-8 rounded-full bg-gray-200 skeleton-shimmer" />
          {/* 사용자명 */}
          <div className="h-4 w-24 bg-gray-200 rounded skeleton-shimmer" />
        </div>
        {/* 시간 + 더보기 */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-gray-200 rounded skeleton-shimmer" />
          <div className="w-5 h-5 bg-gray-200 rounded skeleton-shimmer" />
        </div>
      </header>

      {/* 이미지 영역 스켈레톤 */}
      <div className="aspect-square bg-gray-200 skeleton-shimmer" />

      {/* 액션 버튼 스켈레톤 */}
      <div className="flex items-center justify-between p-3 h-[48px]">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-200 rounded skeleton-shimmer" />
          <div className="w-6 h-6 bg-gray-200 rounded skeleton-shimmer" />
          <div className="w-6 h-6 bg-gray-200 rounded skeleton-shimmer" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded skeleton-shimmer" />
      </div>

      {/* 좋아요 수 스켈레톤 */}
      <div className="px-3 pb-1">
        <div className="h-4 w-20 bg-gray-200 rounded skeleton-shimmer" />
      </div>

      {/* 캡션 스켈레톤 */}
      <div className="px-3 pb-2 space-y-1">
        <div className="h-4 w-full bg-gray-200 rounded skeleton-shimmer" />
        <div className="h-4 w-3/4 bg-gray-200 rounded skeleton-shimmer" />
      </div>

      {/* 댓글 스켈레톤 */}
      <div className="px-3 pb-3 space-y-1">
        <div className="h-3 w-32 bg-gray-200 rounded skeleton-shimmer" />
        <div className="h-3 w-48 bg-gray-200 rounded skeleton-shimmer" />
      </div>

      {/* 댓글 입력 스켈레톤 */}
      <div className="px-3 py-3 border-t border-instagram">
        <div className="h-4 w-16 bg-gray-200 rounded skeleton-shimmer" />
      </div>
    </article>
  );
}

