/**
 * @file components/profile/post-grid-skeleton.tsx
 * @description 게시물 그리드 로딩 스켈레톤 컴포넌트
 *
 * PRD 8. 애니메이션 & 인터랙션 - 로딩 기반
 * - Skeleton UI (회색 박스 애니메이션)
 * - Shimmer 효과 (globals.css의 skeleton-shimmer 클래스 사용)
 * - 3열 그리드 레이아웃
 */

export default function PostGridSkeleton() {
  // 6개의 게시물 스켈레톤 (2행 x 3열)
  const skeletonCount = 6;

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div
          key={index}
          className="aspect-square bg-gray-200 skeleton-shimmer"
        />
      ))}
    </div>
  );
}

