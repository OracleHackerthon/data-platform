// MOCK: tasks - 실제 구현 전 임시 응답
import { mockApi } from "@/app/api/_lib/mock-api";

export async function GET(req: Request) {
  return mockApi(req, "tasks");
}
