// 확정 계약에 따른 DB 기반 API
import { realApi, type IdContext } from "@/app/api/_lib/real-api";

export async function POST(req: Request, context: IdContext) {
  return realApi(req, "diagnose", context);
}
