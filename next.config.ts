import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.60.80.147"],
  // Azure 배포를 위한 standalone 출력 모드
  // .next/standalone 에 자체 포함 서버 생성 → node server.js 로 실행
  output: "standalone",
};

export default nextConfig;
