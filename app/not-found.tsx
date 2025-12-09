/**
 * @file app/not-found.tsx
 * @description 404 페이지
 *
 * 사용자가 존재하지 않는 페이지에 접근했을 때 표시되는 페이지입니다.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-instagram">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-instagram mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-instagram-secondary mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link href="/">
          <Button className="btn-instagram">
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}

