import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 상대 시간 포맷 (Instagram 스타일)
 * @param date - ISO 8601 형식의 날짜 문자열 또는 Date 객체
 * @returns "방금 전", "3분 전", "2시간 전", "3일 전", "2주 전" 등
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) {
    return "방금 전";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}주 전`;
  } else {
    // 4주 이상이면 날짜 표시
    return targetDate.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  }
}

/**
 * 숫자를 한국어 형식으로 포맷 (좋아요 수 등)
 * @param num - 숫자
 * @returns "1,234", "1.2만" 등
 */
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  }
  return num.toLocaleString("ko-KR");
}
