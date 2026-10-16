import { fail } from "@/lib/api";

export class ApiError extends Error {
  constructor(
    readonly status: 400 | 403 | 404 | 409 | 500 | 502,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 실제 route의 catch에서 사용한다. DB 오류 원문을 클라이언트에 노출하지 않는다.
export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) return fail(error.message, error.status);
  console.error("API request failed", error);
  return fail("요청 처리 중 오류가 발생했습니다", 500);
}
