// MOCK: demo/reset - 실제 구현 전 임시 응답
import { mockApi } from "@/app/api/_lib/mock-api";

export async function POST(req: Request) {
  return mockApi(req, "reset");
}
