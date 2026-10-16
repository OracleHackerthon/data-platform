import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용: 실행에 필요한 파일만 .next/standalone 에 모은다
  output: "standalone",
  // oracledb 는 번들하지 않고 Node 모듈로 그대로 불러온다
  serverExternalPackages: ["oracledb"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
