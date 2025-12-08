/**
 * @file lib/supabase/index.ts
 * @description Supabase 클라이언트 모듈 통합 진입점
 *
 * 이 프로젝트는 Clerk 인증 + Supabase 데이터베이스 조합을 사용합니다.
 * 2025년 4월부터 권장되는 네이티브 Third-Party Auth 통합 방식을 적용했습니다.
 *
 * ## 클라이언트 종류 및 사용 시점
 *
 * ### 1. useClerkSupabaseClient (Client Component용)
 * - React Hook으로 제공
 * - 'use client' 컴포넌트에서 사용
 * - 현재 로그인한 사용자의 데이터 접근
 * - RLS 정책이 `auth.jwt()->>'sub'`로 사용자 확인
 *
 * ### 2. createClerkSupabaseClient (Server Component/Action용)
 * - Server Component, Server Action, Route Handler에서 사용
 * - 서버 사이드에서 인증된 요청 수행
 * - RLS 정책이 `auth.jwt()->>'sub'`로 사용자 확인
 *
 * ### 3. getServiceRoleClient (관리자 권한)
 * - RLS를 완전히 우회
 * - 서버 사이드 전용 (절대 클라이언트에 노출 금지)
 * - 웹훅, 백그라운드 작업, 관리자 API에서 사용
 *
 * ### 4. createAnonClient (공개 데이터용)
 * - 인증 없이 접근 가능한 공개 데이터 조회
 * - RLS 정책이 `to anon`으로 설정된 테이블만 접근 가능
 *
 * ## 설정 요구사항
 *
 * ### 환경 변수 (.env)
 * ```
 * NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
 * SUPABASE_SERVICE_ROLE_KEY=xxx
 * ```
 *
 * ### Supabase 대시보드 설정
 * 1. Authentication > Sign In / Up > Third Party Auth로 이동
 * 2. Clerk 선택 후 Clerk 도메인 입력 (예: xxx.clerk.accounts.dev)
 *
 * ### 로컬 개발 설정 (supabase/config.toml)
 * ```toml
 * [auth.third_party.clerk]
 * enabled = true
 * domain = "env(CLERK_DOMAIN)"
 * ```
 *
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 * @see https://supabase.com/docs/guides/auth/third-party/clerk
 */

// Client Component용 Hook
export { useClerkSupabaseClient } from "./clerk-client";

// Server Component/Action용 클라이언트
export { createClerkSupabaseClient } from "./server";

// 관리자 권한 클라이언트 (RLS 우회)
export { getServiceRoleClient } from "./service-role";

// 공개 데이터용 클라이언트 (인증 불필요)
export { createAnonClient, supabase } from "./client";

