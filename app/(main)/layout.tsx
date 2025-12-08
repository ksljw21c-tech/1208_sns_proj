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
 */

"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handleCreatePost = () => {
    setIsCreatePostOpen(true);
    // TODO: CreatePostModal 연결 (5. 게시물 작성에서 구현)
    console.log("게시물 작성 모달 열기");
  };

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
    </div>
  );
}

