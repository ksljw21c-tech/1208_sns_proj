/**
 * @file components/ui/image-with-fallback.tsx
 * @description 이미지 로드 실패 시 기본 이미지 표시 컴포넌트
 *
 * Next.js Image 컴포넌트를 래핑하여 에러 처리 및 재시도 로직 제공
 */

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  sizes,
  priority = false,
  fallbackClassName,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      // 재시도: 이미지 URL에 타임스탬프 추가하여 캐시 무효화
      setRetryCount((prev) => prev + 1);
      setHasError(false);
    } else {
      setHasError(true);
    }
  }, [retryCount]);

  // 에러 발생 시 기본 이미지 표시
  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100",
          fill ? "absolute inset-0" : "",
          className,
          fallbackClassName
        )}
        style={!fill && width && height ? { width, height } : undefined}
      >
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  // 재시도 시 타임스탬프 추가
  const imageSrc = retryCount > 0 ? `${src}?retry=${retryCount}&t=${Date.now()}` : src;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={handleError}
    />
  );
}

