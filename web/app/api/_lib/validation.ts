import { ApiError } from "./api-error";

export function positiveId(value: unknown, name = "id"): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new ApiError(400, `${name}는 양의 정수여야 합니다`);
  }
  return value;
}

export function queryId(value: string | null, name = "id"): number {
  if (!value || !/^[1-9]\d*$/.test(value)) throw new ApiError(400, `${name}가 올바르지 않습니다`);
  return positiveId(Number(value), name);
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const value: unknown = await req.json().catch(() => { throw new ApiError(400, "올바른 JSON 본문이 필요합니다"); });
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "JSON 객체가 필요합니다");
  return value as Record<string, unknown>;
}

export function requiredText(value: unknown, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || [...value].length > maxLength) {
    throw new ApiError(400, `빈 문자열 없이 ${maxLength}자 이내로 입력해 주세요`);
  }
  return value;
}

export function databaseErrorCode(error: unknown): number | undefined {
  return error && typeof error === "object" && "errorNum" in error
    ? Number(error.errorNum) : undefined;
}
