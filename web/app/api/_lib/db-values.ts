import { ApiError } from "./api-error";

// JSON의 필드 구조는 호출하는 기능에서 공유 타입·필수 필드를 별도로 검사한다.
export function parseDbJson(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value !== "string") throw new ApiError(500, "저장된 JSON 형식이 올바르지 않습니다");
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ApiError(500, "저장된 JSON 형식이 올바르지 않습니다");
  }
}

export function dbBoolean(value: unknown): boolean {
  if (value === 0) return false;
  if (value === 1) return true;
  throw new ApiError(500, "저장된 참·거짓 값이 올바르지 않습니다");
}

function validDate(value: unknown): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new ApiError(500, "저장된 날짜 형식이 올바르지 않습니다");
  }
  return value;
}

export function dbDateTime(value: unknown): string | null {
  return value === null ? null : validDate(value).toISOString();
}

export function dbDateOnly(value: unknown): string | null {
  if (value === null) return null;
  const date = validDate(value);
  // Oracle DATE는 시간대 없는 날짜다. JS Date의 로컬 날짜를 유지해 하루 밀림을 막는다.
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
