import { query } from "@/lib/db";
import type { Role } from "@/lib/types";
import { ApiError } from "./api-error";

export type RequestActor =
  | { role: "factory"; label: string; vendorId?: never }
  | { role: "startup"; label: string; vendorId: number };

function positiveId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new ApiError(400, "vendorId는 양의 정수여야 합니다");
  }
  return value;
}

// PLAN B-0. 로그인 인증을 대신하지 않으며 데모 역할·업체 입력만 검증한다.
// POST/PUT route에서 이미 읽은 JSON을 body로 넘기면 본문을 다시 소비하지 않는다.
export async function getActor(req: Request, body?: unknown): Promise<RequestActor> {
  let role: unknown;
  let vendorId: unknown;
  if (req.method === "GET" || req.method === "HEAD") {
    const params = new URL(req.url).searchParams;
    if (params.getAll("role").length > 1 || params.getAll("vendorId").length > 1) {
      throw new ApiError(400, "role과 vendorId는 한 번만 전달해 주세요");
    }
    role = params.get("role");
    const rawId = params.get("vendorId");
    vendorId = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : undefined;
  } else {
    const input: unknown = body === undefined
      ? await req.json().catch(() => { throw new ApiError(400, "올바른 JSON 본문이 필요합니다"); })
      : body;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ApiError(400, "JSON 객체가 필요합니다");
    }
    ({ role, vendorId } = input as Record<string, unknown>);
  }

  if (role === "factory") return { role, label: "공장" };
  if (role !== "startup") throw new ApiError(400, "role은 factory 또는 startup이어야 합니다");

  const id = positiveId(vendorId);
  // 원본·실명·연락처 없이 PLAN에 명시된 업체 별칭만 조회한다.
  const vendors = await query<{ ALIAS: string }>(
    "SELECT alias FROM vendors WHERE id = :vendorId",
    { vendorId: id },
  );
  if (!vendors.length) throw new ApiError(400, "올바른 업체를 선택해 주세요");
  return { role, vendorId: id, label: vendors[0].ALIAS };
}

export function requireRole(actor: RequestActor, expected: Role): void {
  if (actor.role !== expected) throw new ApiError(403, "이 역할로는 요청할 수 없습니다");
}
