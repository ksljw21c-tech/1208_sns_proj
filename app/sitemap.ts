import { MetadataRoute } from "next";

/**
 * @file app/sitemap.ts
 * @description 사이트맵 생성
 *
 * 동적 라우트를 포함한 사이트맵을 생성합니다.
 * 프로필 페이지는 동적이므로 정적 경로만 포함합니다.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}

