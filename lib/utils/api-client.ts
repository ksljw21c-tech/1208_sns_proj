/**
 * @file lib/utils/api-client.ts
 * @description API 클라이언트 유틸리티
 *
 * 네트워크 에러 처리 및 사용자 친화적 에러 메시지를 포함한 fetch 래퍼
 */

import { extractApiError, extractErrorInfo, isNetworkError } from "./error-handler";

export interface ApiClientOptions extends RequestInit {
  timeout?: number;
  showErrorToast?: boolean;
}

/**
 * 네트워크 에러를 포함한 개선된 fetch 래퍼
 */
export async function apiFetch(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  // 타임아웃 설정
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 네트워크 에러 체크
    if (!response.ok) {
      const errorInfo = await extractApiError(response).catch((err) => {
        // JSON 파싱 실패 시 기본 에러 정보 반환
        return extractErrorInfo(err, response.status);
      });

      // 네트워크 에러인지 확인
      if (isNetworkError(errorInfo.originalError)) {
        throw new Error("인터넷 연결을 확인해주세요.");
      }

      throw new Error(errorInfo.message);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // 네트워크 에러 처리
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      }

      if (isNetworkError(error)) {
        throw new Error("인터넷 연결을 확인해주세요.");
      }

      throw error;
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * JSON 응답을 파싱하는 헬퍼
 */
export async function apiJson<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const response = await apiFetch(url, options);
  return response.json();
}

