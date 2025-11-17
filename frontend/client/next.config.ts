import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper output for Vercel
  output: undefined, // Default: server-side rendering
  
  // SSR 중 location 객체 접근 방지
  experimental: {
    // 서버 컴포넌트에서 클라이언트 전용 코드 실행 방지
  },
  
  // 빌드 중 static optimization 경고 무시
  onDemandEntries: {
    // pages 폴더가 없으므로 이 설정은 적용되지 않음
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Turbopack 설정 (Next.js 16 기본)
  turbopack: {},
};

export default nextConfig;
