// 확정 계약에 따른 DB 기반 API
import { realApi } from "@/app/api/_lib/real-api";

export async function POST(req: Request) {
  return realApi(req, "reset");
}
