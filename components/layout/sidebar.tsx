/**
 * @file components/layout/sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * PRD 2. 레이아웃 구조 기반
 * - Desktop (1024px+): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px ~ 1024px): 72px 너비, 아이콘만
 * - Mobile (< 768px): 숨김
 *
 * 메뉴 항목: 홈, 검색, 만들기, 프로필
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Search, PlusSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}

interface SidebarProps {
  onCreatePost?: () => void;
}

export default function Sidebar({ onCreatePost }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  // 네비게이션 메뉴 항목
  const navItems: NavItem[] = [
    {
      href: "/",
      label: "홈",
      icon: Home,
    },
    {
      href: "/search",
      label: "검색",
      icon: Search,
    },
    {
      href: "#",
      label: "만들기",
      icon: PlusSquare,
      onClick: onCreatePost,
    },
    {
      href: `/profile/${user?.id || ""}`,
      label: "프로필",
      icon: User,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-instagram",
        "hidden md:flex flex-col",
        // Desktop: 244px
        "lg:w-[244px]",
        // Tablet: 72px
        "md:w-[72px]",
        "z-50"
      )}
    >
      {/* 로고 영역 */}
      <div className="p-4 lg:px-6 lg:py-8">
        <Link href="/" className="block">
          {/* Desktop: 텍스트 로고 */}
          <h1 className="hidden lg:block text-2xl font-semibold text-instagram">
            Instagram
          </h1>
          {/* Tablet: 아이콘 로고 */}
          <div className="lg:hidden flex justify-center">
            <Home className="w-7 h-7 text-instagram" />
          </div>
        </Link>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-2 lg:px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href !== "#" && pathname === item.href;
            const Icon = item.icon;

            // 만들기 버튼은 링크가 아닌 버튼으로 처리
            if (item.onClick) {
              return (
                <li key={item.label}>
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-lg",
                      "hover:bg-gray-100 transition-colors",
                      "lg:justify-start justify-center"
                    )}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                    <span className="hidden lg:block text-base">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg",
                    "hover:bg-gray-100 transition-colors",
                    "lg:justify-start justify-center",
                    isActive && "font-bold"
                  )}
                >
                  <Icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <span className="hidden lg:block text-base">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 영역 (추가 메뉴용) */}
      <div className="p-4 border-t border-instagram">
        {/* 추후 설정, 더보기 메뉴 추가 가능 */}
      </div>
    </aside>
  );
}

