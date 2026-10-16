import type { ValueIndex } from "@/lib/types";
import { ApiError } from "./api-error";
import { parseDbJson } from "./db-values";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const number = (v: unknown, min: number, max = Infinity): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const score = (v: unknown) => v === null || number(v, 0, 10);
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim();

export function isValueIndex(v: unknown): v is ValueIndex {
  if (!isRecord(v) || !number(v.score, 300, 1000) || !Number.isInteger(v.score) || v.min !== 300 || v.max !== 1000) return false;
  const keys = ["content", "quality", "usability", "economy"];
  return Array.isArray(v.areas) && v.areas.length === 4
    && new Set(v.areas.map((a) => isRecord(a) ? a.key : null)).size === 4
    && v.areas.every((a: unknown) => isRecord(a) && keys.includes(String(a.key)) && text(a.label) && number(a.weight, 0, 100) && score(a.score))
    && Array.isArray(v.elements) && v.elements.length > 0
    && v.elements.every((e: unknown) => isRecord(e) && text(e.key) && text(e.label) && keys.includes(String(e.area)) && number(e.weight, 0, 100) && number(e.adjustedWeight, 0, 100) && score(e.score) && ["sql", "llm", "meta"].includes(String(e.source)))
    && Array.isArray(v.suggestions) && v.suggestions.length <= 3
    && v.suggestions.every((s: unknown) => isRecord(s) && text(s.element) && text(s.label) && text(s.text) && number(s.expectedGain, 0) && Number.isInteger(s.expectedGain));
}

// AI는 평가 제외 요소의 가중치를 null로 반환한다. 화면 계약(number)에 맞춰
// 기여도가 없는 요소만 0으로 표기하며, 실제 점수·활성 요소의 가중치는 유지한다.
export function normalizeExcludedWeights(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.elements)) return value;
  return { ...value, elements: value.elements.map((element: unknown) =>
    isRecord(element) && element.score === null && element.adjustedWeight === null
      ? { ...element, adjustedWeight: 0 } : element) };
}

export function storedValueIndex(value: unknown): ValueIndex {
  const parsed = normalizeExcludedWeights(parseDbJson(value));
  if (!isValueIndex(parsed)) throw new ApiError(500, "저장된 가치평가지수 형식이 올바르지 않습니다");
  return parsed;
}

export function summaryValueIndex(value: ValueIndex) {
  const { score, min, max, areas } = value;
  return { score, min, max, areas };
}
