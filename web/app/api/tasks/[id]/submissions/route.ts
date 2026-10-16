// MOCK: tasks/[id]/submissions - 실제 구현 전 임시 응답
import { mockApi, type IdContext } from "@/app/api/_lib/mock-api";

export async function POST(req: Request, context: IdContext) {
  return mockApi(req, "submit", context);
}
