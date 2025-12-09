import { MetadataRoute } from "next";

/**
 * @file app/robots.ts
 * @description 검색 엔진 크롤러 설정
 *
 * robots.txt 파일을 동적으로 생성합니다.
 * 프로덕션 환경에서는 모든 크롤러를 허용하고,
 * 개발 환경에서는 크롤링을 제한할 수 있습니다.
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // API 라우트는 크롤링 제외
          "/auth-test/", // 테스트 페이지 제외
          "/storage-test/", // 테스트 페이지 제외
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

