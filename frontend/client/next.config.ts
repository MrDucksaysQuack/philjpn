import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper output for Vercel
  output: undefined, // Default: server-side rendering
  
  // SSR 중 location 객체 접근 방지
  experimental: {
    // 서버 컴포넌트에서 클라이언트 전용 코드 실행 방지
  },
  
  // Admin 페이지들을 동적 렌더링으로 강제
  // 이 설정은 모든 페이지를 동적으로 렌더링하여 SSR 중 location 접근 방지
};

export default nextConfig;
