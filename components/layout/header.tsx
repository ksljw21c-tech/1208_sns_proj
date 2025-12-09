/**
 * @file components/layout/header.tsx
 * @description Instagram 스타일 모바일 헤더 컴포넌트
 *
 * PRD 2. 레이아웃 구조 기반
 * - Mobile 전용 (< 768px)
 * - 높이: 60px
 * - 로고 + 알림/DM/프로필 아이콘
 */

"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-instagram z-50 md:hidden">
      <div className="flex items-center justify-between h-full px-4">
        {/* 로고 */}
        <Link href="/" className="text-xl font-semibold text-instagram">
          Instagram
        </Link>

        {/* 우측 아이콘 */}
        <div className="flex items-center gap-4">
          {/* 알림 아이콘 (1차 MVP 제외 - UI만 표시) */}
          <button
            className="p-1 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none rounded"
            aria-label="알림"
            disabled
            aria-disabled="true"
          >
            <Heart className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* DM 아이콘 (1차 MVP 제외 - UI만 표시) */}
          <button
            className="p-1 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-instagram-blue focus-visible:ring-offset-2 focus-visible:outline-none rounded"
            aria-label="메시지"
            disabled
            aria-disabled="true"
          >
            <Send className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* 프로필/로그인 */}
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" className="btn-instagram">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

