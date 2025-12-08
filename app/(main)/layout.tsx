/**
 * @file app/(main)/layout.tsx
 * @description 메인 레이아웃 (인증된 사용자용)
 *
 * PRD 2. 레이아웃 구조 기반
 * - Desktop (1024px+): Sidebar 244px + Main Feed 최대 630px
 * - Tablet (768px ~ 1024px): Sidebar 72px + Main Feed
 * - Mobile (< 768px): Header + Main Feed + Bottom Nav
 *
 * 구성:
 * - Sidebar: Desktop/Tablet에서 표시
 * - Header: Mobile에서만 표시
 * - BottomNav: Mobile에서만 표시
 * - CreatePostModal: 게시물 작성 모달
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import CreatePostModal from "@/components/post/create-post-modal";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handleCreatePost = useCallback(() => {
    setIsCreatePostOpen(true);
  }, []);

  const handleCloseCreatePost = useCallback(() => {
    setIsCreatePostOpen(false);
  }, []);

  const handlePostSuccess = useCallback(() => {
    // 피드 새로고침
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-screen bg-instagram">
      {/* Mobile Header */}
      <Header />

      {/* Desktop/Tablet Sidebar */}
      <Sidebar onCreatePost={handleCreatePost} />

      {/* Main Content Area */}
      <main
        className={`
          min-h-screen
          pt-[60px] pb-[50px]
          md:pt-0 md:pb-0
          md:ml-[72px]
          lg:ml-[244px]
        `}
      >
        {/* Content Container - 최대 630px, 중앙 정렬 */}
        <div className="max-w-[630px] mx-auto px-0 md:px-4 py-4 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav onCreatePost={handleCreatePost} />

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreatePostOpen}
        onClose={handleCloseCreatePost}
        onSuccess={handlePostSuccess}
      />
    </div>
  );
}

