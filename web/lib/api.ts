// 모든 API 응답은 { ok, data?, error? } 형식을 따른다 (docs/API_CONTRACT.md)
import { NextResponse } from "next/server";

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { status });
}

export function fail(error: string, status = 500) {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error }, { status });
}
