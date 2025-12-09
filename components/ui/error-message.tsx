/**
 * @file components/ui/error-message.tsx
 * @description 사용자 친화적 에러 메시지 표시 컴포넌트
 *
 * 재시도 버튼 포함, 다양한 에러 타입에 대한 적절한 UI 제공
 */

"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ErrorType } from "@/lib/utils/error-handler";

interface ErrorMessageProps {
  message: string;
  errorType?: ErrorType;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

export default function ErrorMessage({
  message,
  errorType = "unknown",
  onRetry,
  className,
  showIcon = true,
}: ErrorMessageProps) {
  const getIcon = () => {
    if (errorType === "network") {
      return <WifiOff className="w-5 h-5" />;
    }
    return <AlertCircle className="w-5 h-5" />;
  };

  const getBackgroundColor = () => {
    switch (errorType) {
      case "network":
        return "bg-yellow-50 border-yellow-200";
      case "authentication":
        return "bg-blue-50 border-blue-200";
      case "server":
        return "bg-red-50 border-red-200";
      case "client":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTextColor = () => {
    switch (errorType) {
      case "network":
        return "text-yellow-800";
      case "authentication":
        return "text-blue-800";
      case "server":
        return "text-red-800";
      case "client":
        return "text-orange-800";
      default:
        return "text-gray-800";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex items-start gap-3",
        getBackgroundColor(),
        className
      )}
    >
      {showIcon && (
        <div className={cn("flex-shrink-0 mt-0.5", getTextColor())}>
          {getIcon()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", getTextColor())}>{message}</p>

        {errorType === "network" && (
          <p className="text-xs mt-1 text-gray-600">
            인터넷 연결을 확인하고 다시 시도해주세요.
          </p>
        )}
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  );
}

