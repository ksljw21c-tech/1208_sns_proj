/**
 * @file components/layout/bottom-nav.tsx
 * @description Instagram 스타일 모바일 하단 네비게이션 컴포넌트
 *
 * PRD 2. 레이아웃 구조 기반
 * - Mobile 전용 (< 768px)
 * - 높이: 50px
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}

interface BottomNavProps {
  onCreatePost?: () => void;
}

export default function BottomNav({ onCreatePost }: BottomNavProps) {
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
      href: "/activity",
      label: "좋아요",
      icon: Heart,
    },
    {
      href: "/profile",
      label: "프로필",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-instagram z-50 md:hidden">
      <ul className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && pathname === item.href;
          const Icon = item.icon;

          // 만들기 버튼은 링크가 아닌 버튼으로 처리
          if (item.onClick) {
            return (
              <li key={item.label}>
                <button
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center p-2"
                  aria-label={item.label}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </button>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2",
                  "transition-opacity"
                )}
                aria-label={item.label}
              >
                <Icon
                  className={cn("w-6 h-6", isActive && "fill-current")}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

