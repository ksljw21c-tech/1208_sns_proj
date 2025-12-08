/**
 * @file lib/types.ts
 * @description Mini Instagram SNS 프로젝트의 TypeScript 타입 정의
 *
 * 데이터베이스 스키마 (supabase/migrations/db.sql) 기반으로 정의
 * - User: 사용자 정보 (Clerk 연동)
 * - Post: 게시물
 * - Like: 좋아요
 * - Comment: 댓글
 * - Follow: 팔로우 관계
 */

// ============================================
// User 타입
// ============================================

/** 사용자 기본 정보 */
export interface User {
  id: string; // UUID
  clerk_id: string; // Clerk user ID
  name: string;
  created_at: string; // ISO 8601
}

/** 사용자 통계 정보 (user_stats 뷰) */
export interface UserStats extends User {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

/** 사용자 프로필 (Clerk 정보 포함) */
export interface UserProfile extends UserStats {
  image_url?: string; // Clerk에서 가져온 프로필 이미지
  email?: string;
}

// ============================================
// Post 타입
// ============================================

/** 게시물 기본 정보 */
export interface Post {
  id: string; // UUID
  user_id: string; // UUID
  image_url: string; // Supabase Storage URL
  caption: string | null; // 최대 2,200자
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** 게시물 통계 정보 (post_stats 뷰) */
export interface PostStats extends Post {
  likes_count: number;
  comments_count: number;
}

/** 게시물 + 작성자 정보 (피드용) */
export interface PostWithUser extends PostStats {
  user: User;
  is_liked?: boolean; // 현재 사용자가 좋아요 했는지
}

/** 게시물 생성 요청 */
export interface CreatePostRequest {
  caption?: string;
  image: File;
}

// ============================================
// Like 타입
// ============================================

/** 좋아요 정보 */
export interface Like {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  created_at: string; // ISO 8601
}

/** 좋아요 생성/삭제 요청 */
export interface LikeRequest {
  post_id: string;
}

// ============================================
// Comment 타입
// ============================================

/** 댓글 기본 정보 */
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  content: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** 댓글 + 작성자 정보 */
export interface CommentWithUser extends Comment {
  user: User;
}

/** 댓글 생성 요청 */
export interface CreateCommentRequest {
  post_id: string;
  content: string;
}

// ============================================
// Follow 타입
// ============================================

/** 팔로우 정보 */
export interface Follow {
  id: string; // UUID
  follower_id: string; // UUID (팔로우하는 사람)
  following_id: string; // UUID (팔로우받는 사람)
  created_at: string; // ISO 8601
}

/** 팔로우 생성/삭제 요청 */
export interface FollowRequest {
  user_id: string; // 팔로우/언팔로우할 사용자 ID
}

/** 팔로우 상태 */
export interface FollowStatus {
  is_following: boolean;
  is_followed_by: boolean; // 상대방이 나를 팔로우하는지
}

// ============================================
// API Response 타입
// ============================================

/** API 성공 응답 */
export interface ApiResponse<T> {
  data: T;
  error: null;
}

/** API 에러 응답 */
export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
  };
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// ============================================
// UI 관련 타입
// ============================================

/** 로딩 상태 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/** 모달 상태 */
export interface ModalState {
  isOpen: boolean;
  type?: "create-post" | "post-detail" | "followers" | "following";
  data?: unknown;
}

/** 피드 필터 옵션 */
export interface FeedOptions {
  user_id?: string; // 특정 사용자의 게시물만
  limit?: number; // 기본값: 10
  offset?: number; // 기본값: 0
}

