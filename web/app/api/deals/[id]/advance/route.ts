// 10/17 시연용 거래 단계 진행 (결제 없음). API_CONTRACT B-4
import { realApi, type IdContext } from "@/app/api/_lib/real-api";

export async function POST(req: Request, context: IdContext) {
  return realApi(req, "advance", context);
}
