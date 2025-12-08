/**
 * @file app/(main)/page.tsx
 * @description 홈 피드 페이지
 *
 * PRD 3. 홈 피드 페이지 기반
 * - 배경색: #FAFAFA (레이아웃에서 설정)
 * - PostFeed 컴포넌트로 게시물 표시
 * - 무한 스크롤 (PostFeed에서 처리)
 */

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import PostFeed from "@/components/post/post-feed";

export default function HomePage() {
  return (
    <div className="space-y-4">
      {/* 비로그인 상태 */}
      <SignedOut>
        <div className="bg-white rounded-lg border border-instagram p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Instagram에 오신 것을 환영합니다</h2>
          <p className="text-instagram-secondary mb-4">
            피드를 보려면 로그인해 주세요.
          </p>
          <SignInButton mode="modal">
            <Button className="btn-instagram">로그인</Button>
          </SignInButton>
        </div>
      </SignedOut>

      {/* 로그인 상태 - 피드 표시 */}
      <SignedIn>
        <PostFeed />
      </SignedIn>
    </div>
  );
}
