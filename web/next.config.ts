import type { NextConfig } from "next";

// 로컬 화면 개발용 (10/17): 로컬에는 DB 접속 정보가 없어 실제 API 가 500 이 난다.
// web/.env.local 에 DEV_API_PROXY=http://<배포 주소> 를 넣으면 npm run dev 에서만 /api/* 를 배포본으로 보낸다.
// 배포 빌드(production)에서는 꺼진다. 배포본 DB 를 같이 쓰므로 확인 뒤 /api/demo/reset 으로 되돌린다.
const devApiProxy = process.env.NODE_ENV !== "production" ? process.env.DEV_API_PROXY : undefined;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!devApiProxy) return [];
    return {
      beforeFiles: [{ source: "/api/:path*", destination: `${devApiProxy.replace(/\/$/, "")}/api/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },
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
