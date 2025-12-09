/**
 * @file lib/utils/error-handler.ts
 * @description 공통 에러 처리 유틸리티
 *
 * 네트워크 에러 감지, HTTP 상태 코드별 메시지 매핑,
 * 에러 타입 분류, 에러 로깅 헬퍼 함수 제공
 */

/**
 * 에러 타입 분류
 */
export type ErrorType = "network" | "authentication" | "server" | "client" | "unknown";

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    );
  }

  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.message.includes("ERR_NETWORK")
    );
  }

  return false;
}

/**
 * HTTP 상태 코드별 사용자 친화적 메시지 매핑
 */
export function getErrorMessage(statusCode: number, defaultMessage?: string): string {
  const messageMap: Record<number, string> = {
    400: "잘못된 요청입니다. 입력한 정보를 확인해주세요.",
    401: "로그인이 필요합니다.",
    403: "접근 권한이 없습니다.",
    404: "요청한 리소스를 찾을 수 없습니다.",
    409: "이미 처리된 요청입니다.",
    413: "파일 크기가 너무 큽니다.",
    422: "입력한 정보가 올바르지 않습니다.",
    429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    502: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
    503: "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
    504: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
  };

  return messageMap[statusCode] || defaultMessage || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * 에러 타입 분류
 */
export function classifyError(error: unknown, statusCode?: number): ErrorType {
  // 네트워크 에러
  if (isNetworkError(error)) {
    return "network";
  }

  // HTTP 상태 코드 기반 분류
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      return "authentication";
    }
    if (statusCode >= 500) {
      return "server";
    }
    if (statusCode >= 400) {
      return "client";
    }
  }

  return "unknown";
}

/**
 * 에러 정보 추출
 */
export function extractErrorInfo(error: unknown, statusCode?: number): ErrorInfo {
  const type = classifyError(error, statusCode);
  let message = "알 수 없는 오류가 발생했습니다.";

  // HTTP 상태 코드가 있으면 해당 메시지 사용
  if (statusCode) {
    message = getErrorMessage(statusCode);
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  return {
    type,
    message,
    statusCode,
    originalError: error,
  };
}

/**
 * 에러 로깅 (개발 환경에서만 상세 로깅)
 */
export function logError(error: unknown, context?: string): void {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    console.group(`🚨 에러 발생${context ? `: ${context}` : ""}`);
    console.error("에러:", error);
    if (error instanceof Error) {
      console.error("스택:", error.stack);
    }
    console.groupEnd();
  } else {
    // 프로덕션에서는 간단한 로깅만
    console.error(`에러${context ? ` (${context})` : ""}:`, error instanceof Error ? error.message : String(error));
  }
}

/**
 * API 응답에서 에러 추출
 */
export async function extractApiError(response: Response): Promise<ErrorInfo> {
  let errorMessage = "요청 처리에 실패했습니다.";

  try {
    const data = await response.json();
    if (data.error) {
      errorMessage = typeof data.error === "string" ? data.error : data.error.message || errorMessage;
    }
  } catch {
    // JSON 파싱 실패 시 기본 메시지 사용
  }

  return extractErrorInfo(new Error(errorMessage), response.status);
}

/**
 * fetch 에러 처리 헬퍼
 */
export async function handleFetchError(response: Response, context?: string): Promise<never> {
  const errorInfo = await extractApiError(response);
  logError(errorInfo.originalError, context);
  throw new Error(errorInfo.message);
}

