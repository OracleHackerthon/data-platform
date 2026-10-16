// MOCK: tasks/[id]/leaderboard - 실제 구현 전 임시 응답
import { mockApi, type IdContext } from "@/app/api/_lib/mock-api";

export async function GET(req: Request, context: IdContext) {
  return mockApi(req, "leaderboard", context);
}
