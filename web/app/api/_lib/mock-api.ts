// MOCK: B-1~B-6 요청 처리 - 실제 구현 전 임시 응답
import { connection } from "next/server";
import { ok, fail } from "@/lib/api";
import {
  vendors, metrics, valueIndex, taskCard, report, synthPreview, distributions,
  getState, resetState, publicValueIndex, logAction, canViewTask,
  latestSubmission, dealResponse, type Role,
} from "./mock-data";

type Action = "diagnose" | "policy" | "tasks" | "task" | "submit" | "leaderboard"
  | "request_contact" | "deals" | "accept" | "contract" | "deal" | "access_log" | "reset";
export type IdContext = { params: Promise<{ id: string }> };
class InputError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
function positiveId(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new InputError("ID는 양의 정수여야 합니다", 400);
  }
  return value;
}
function queryId(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) throw new InputError("ID가 없거나 올바르지 않습니다", 400);
  return positiveId(Number(value));
}
function requireRole(role: unknown, expected?: Role): asserts role is Role {
  if ((role !== "factory" && role !== "startup") || (expected && role !== expected)) {
    throw new InputError("이 역할로는 요청할 수 없습니다", 403);
  }
}
function requireVendor(value: unknown) {
  const id = positiveId(value);
  if (!vendors.some((v) => v.id === id)) throw new InputError("업체를 찾을 수 없습니다", 404);
  return id;
}
function requireTask(id: number | undefined, vendorId?: number) {
  if (id !== 1 || (vendorId !== undefined && !canViewTask(vendorId))) {
    throw new InputError("과제를 찾을 수 없습니다", 404);
  }
}
function requiredText(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new InputError("계약 항목을 모두 입력해 주세요", 400);
  return value;
}

export async function mockApi(req: Request, action: Action, context?: IdContext) {
  await connection();
  try {
    const state = getState();
    if (action === "reset") {
      resetState(); // 초기화 후 접근 기록도 비어 있어야 하므로 별도 기록을 남기지 않는다.
      return ok({ reset: true });
    }
    const isRead = req.method === "GET";
    let body: Record<string, unknown> = {};
    if (!isRead) {
      const parsed: unknown = await req.json().catch(() => { throw new InputError("올바른 JSON 본문이 필요합니다", 400); });
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new InputError("JSON 객체가 필요합니다", 400);
      body = parsed as Record<string, unknown>;
    }
    const query = new URL(req.url).searchParams;
    const role = isRead ? query.get("role") : body.role;
    const startupOnly = action === "tasks" || action === "submit" || action === "accept";
    const factoryOnly = ["diagnose", "policy", "leaderboard", "request_contact", "contract", "access_log"].includes(action);
    requireRole(role, startupOnly ? "startup" : factoryOnly ? "factory" : undefined);
    const vendorId = role === "startup" ? requireVendor(isRead ? queryId(query.get("vendorId")) : body.vendorId) : undefined;
    const id = context ? queryId((await context.params).id) : undefined;

    switch (action) {
      case "diagnose": {
        if (id !== 1) return fail("데이터셋을 찾을 수 없습니다", 404);
        state.diagnosed = true;
        logAction(role, vendorId, "diagnose", "dataset:1");
        return ok({ datasetId: 1, taskId: 1, metrics, valueIndex, report, taskCard });
      }
      case "policy": {
        requireTask(id);
        if (typeof body.synthLevel !== "string" || !["low", "medium", "high"].includes(body.synthLevel) ||
          !(body.blockIndustry === null || (typeof body.blockIndustry === "string" && vendors.some((v) => v.industry === body.blockIndustry)))) {
          return fail("합성 수준과 차단 업종을 확인해 주세요", 400);
        }
        if (!state.diagnosed) return fail("먼저 데이터 진단을 실행해 주세요", 409);
        state.synthLevel = body.synthLevel as typeof state.synthLevel;
        state.blockIndustry = body.blockIndustry as string | null;
        state.status = "published";
        logAction(role, vendorId, "publish", "task:1");
        return ok({ taskId: 1, synthLevel: state.synthLevel, blockIndustry: state.blockIndustry, status: state.status });
      }
      case "tasks": {
        logAction(role, vendorId, "list_tasks", "tasks");
        return ok(canViewTask(vendorId!) ? [{ id: 1, ...taskCard, rowCount: metrics.rowCount, synthLevel: state.synthLevel, valueIndex: publicValueIndex() }] : []);
      }
      case "task": {
        requireTask(id, vendorId);
        const common = {
          id: 1, title: state.diagnosed ? taskCard.title : null,
          problem: state.diagnosed ? taskCard.problem : null,
          metric: state.diagnosed ? taskCard.metric : null,
          dataNeeded: state.diagnosed ? taskCard.dataNeeded : null,
          status: state.status, synthLevel: state.synthLevel, blockIndustry: state.blockIndustry,
        };
        logAction(role, vendorId, "view_task", "task:1");
        if (role === "factory") return ok({ ...common, datasetId: 1, metrics: state.diagnosed ? metrics : null, valueIndex: state.diagnosed ? valueIndex : null, report: state.diagnosed ? report : null });
        const submission = latestSubmission(vendorId!);
        return ok({ ...common, valueIndex: publicValueIndex(), synthPreview, distributions,
          mySubmission: submission ? { accuracy: submission.accuracy, recall: submission.recall, fpr: submission.fpr, createdAt: submission.createdAt } : null });
      }
      case "submit": {
        requireTask(id, vendorId);
        const scores = [
          { vendorId: 1, accuracy: 0.94, recall: 0.67, fpr: 0.04 },
          { vendorId: 2, accuracy: 0.96, recall: 0.81, fpr: 0.02 },
          { vendorId: 3, accuracy: 0.92, recall: 0.55, fpr: 0.06 },
        ].find((s) => s.vendorId === vendorId);
        if (!scores) return fail("이 업체의 예측값이 없습니다", 400);
        const submission = { ...scores, submissionId: state.nextSubmissionId++, createdAt: new Date().toISOString() };
        state.submissions.push(submission);
        logAction(role, vendorId, "submit", "task:1");
        return ok({ submissionId: submission.submissionId, accuracy: submission.accuracy, recall: submission.recall, fpr: submission.fpr, createdAt: submission.createdAt });
      }
      case "leaderboard": {
        requireTask(id);
        const rows = vendors.flatMap((vendor) => {
          const submission = latestSubmission(vendor.id);
          if (!submission) return [];
          const deal = state.deals.find((d) => d.vendorId === vendor.id);
          return [{ vendorId: vendor.id, alias: vendor.alias, accuracy: submission.accuracy, recall: submission.recall, fpr: submission.fpr,
            submittedAt: submission.createdAt, badges: vendor.badges, deal: deal ? { id: deal.id, status: deal.status } : null }];
        }).sort((a, b) => b.recall - a.recall || b.accuracy - a.accuracy);
        logAction(role, vendorId, "view_leaderboard", "task:1");
        return ok(rows);
      }
      case "request_contact": {
        const taskId = positiveId(body.taskId);
        requireTask(taskId);
        const targetVendorId = requireVendor(body.vendorId);
        if (state.deals.some((d) => d.taskId === taskId && d.vendorId === targetVendorId)) return fail("이미 연락을 요청했습니다", 409);
        const deal = { id: state.nextDealId++, taskId, vendorId: targetVendorId,
          status: "requested" as const, stage: "contract" as const, contract: null, createdAt: new Date().toISOString() };
        state.deals.push(deal);
        logAction(role, vendorId, "request_contact", `deal:${deal.id}`);
        return ok(dealResponse(deal, role));
      }
      case "deals": {
        const taskId = role === "factory" ? queryId(query.get("taskId")) : undefined;
        if (taskId !== undefined) requireTask(taskId);
        const deals = state.deals.filter((d) => role === "factory" ? d.taskId === taskId : d.vendorId === vendorId)
          .toReversed().map((d) => dealResponse(d, role));
        logAction(role, vendorId, "list_deals", role === "factory" ? `task:${taskId}` : `vendor:${vendorId}`);
        return ok(deals);
      }
      case "deal":
      case "accept":
      case "contract": {
        const deal = state.deals.find((d) => d.id === id);
        if (!deal) return fail("거래를 찾을 수 없습니다", 404);
        if (role === "startup" && deal.vendorId !== vendorId) return fail("이 거래에 접근할 수 없습니다", 403);
        if (action === "accept") {
          if (deal.status !== "requested") return fail("연락 요청 상태에서만 수락할 수 있습니다", 409);
          deal.status = "accepted";
          logAction(role, vendorId, "accept", `deal:${deal.id}`);
        } else if (action === "contract") {
          if (typeof body.price !== "number" || !Number.isSafeInteger(body.price) || body.price < 0) return fail("가격은 0 이상의 원 단위 정수여야 합니다", 400);
          const contract = { price: body.price, purpose: requiredText(body.purpose), period: requiredText(body.period), scope: requiredText(body.scope), delivery: requiredText(body.delivery) };
          if (deal.status !== "accepted") return fail("수락된 거래에만 계약을 저장할 수 있습니다", 409);
          deal.contract = contract;
          deal.status = "contracted";
          deal.stage = "payment_pending";
          logAction(role, vendorId, "save_contract", `deal:${deal.id}`);
        } else {
          logAction(role, vendorId, "view_deal", `deal:${deal.id}`);
        }
        return ok(dealResponse(deal, role));
      }
      case "access_log": {
        logAction(role, vendorId, "view_access_log", "access-log");
        return ok({ rawDownloadCount: state.logs.filter((item) => item.action === "raw_download").length, items: state.logs });
      }
    }
  } catch (error) {
    if (error instanceof InputError) return fail(error.message, error.status);
    console.error("MOCK API failed", error);
    return fail("Mock 처리 중 오류가 발생했습니다", 500);
  }
}
