import { connection } from "next/server";
import { ok } from "@/lib/api";
import { query } from "@/lib/db";
import type { AccessLog, AccessAction } from "@/lib/types";
import { getActor, requireRole } from "./actor";
import { ApiError, apiErrorResponse } from "./api-error";
import { logAccess } from "./access-log";
import { dbDateTime } from "./db-values";
import { positiveId, queryId, readBody, requiredText, databaseErrorCode } from "./validation";
import { diagnose } from "./diagnose";
import { loadTask, listTasks, taskDetail } from "./tasks";
import { submit, leaderboard } from "./submissions";
import { requestContact, getDeal, listDeals, acceptDeal, saveContract, advanceStage } from "./deals";
import { resetDemo } from "./demo-reset";

type Action = "diagnose" | "policy" | "tasks" | "task" | "submit" | "leaderboard"
  | "request_contact" | "deals" | "accept" | "contract" | "advance" | "deal" | "access_log" | "reset";
export type IdContext = { params: Promise<{ id: string }> };

export async function realApi(req: Request, action: Action, context?: IdContext) {
  await connection();
  try {
    if (action === "reset") return ok(await resetDemo());
    const body = req.method === "GET" ? undefined : await readBody(req);
    const actor = await getActor(req, body);
    const startupOnly = ["tasks", "submit", "accept"].includes(action);
    const factoryOnly = ["diagnose", "policy", "leaderboard", "request_contact", "contract", "advance", "access_log"].includes(action);
    if (startupOnly) requireRole(actor, "startup");
    if (factoryOnly) requireRole(actor, "factory");
    const id = context ? queryId((await context.params).id) : undefined;
    const params = new URL(req.url).searchParams;
    const log = (event: AccessAction, target: string | null) => logAccess(actor, event, target);

    switch (action) {
      case "diagnose": {
        const result = await diagnose(id!);
        await log("diagnose", `dataset:${id}`);
        return ok(result);
      }
      case "policy": {
        const task = await loadTask(id!, actor);
        const level = body!.synthLevel, industry = body!.blockIndustry;
        if (typeof level !== "string" || !["low", "medium", "high"].includes(level)) throw new ApiError(400, "합성 수준이 올바르지 않습니다");
        if (industry !== null) {
          if (typeof industry !== "string" || [...industry].length > 100) throw new ApiError(400, "차단 업종이 올바르지 않습니다");
          const matches = await query<{ ID: number }>("SELECT id FROM vendors WHERE industry = :industry FETCH FIRST 1 ROW ONLY", { industry });
          if (!matches.length) throw new ApiError(400, "차단 업종이 올바르지 않습니다");
        }
        if (!task.TITLE || !task.VALUE_DETAIL) throw new ApiError(409, "먼저 데이터 진단을 실행해 주세요");
        await query(`BEGIN
          UPDATE tasks SET synth_level = :level, block_industry = :industry, status = 'published'
          WHERE id = :id AND title IS NOT NULL AND value_detail IS NOT NULL;
          IF SQL%ROWCOUNT <> 1 THEN RAISE_APPLICATION_ERROR(-20001, 'Diagnosis state changed'); END IF;
        END;`, { id: id!, level, industry });
        await log("publish", `task:${id}`);
        return ok({ taskId: id!, synthLevel: level, blockIndustry: industry, status: "published" });
      }
      case "tasks": {
        const result = await listTasks(actor);
        await log("list_tasks", "tasks");
        return ok(result);
      }
      case "task": {
        const task = await loadTask(id!, actor);
        const result = await taskDetail(task, actor);
        await log("view_task", `task:${id}`);
        return ok(result);
      }
      case "submit": {
        await loadTask(id!, actor);
        const result = await submit(id!, actor.vendorId!);
        await log("submit", `task:${id}`);
        return ok(result);
      }
      case "leaderboard": {
        await loadTask(id!, actor);
        const result = await leaderboard(id!);
        await log("view_leaderboard", `task:${id}`);
        return ok(result);
      }
      case "request_contact": {
        const taskId = positiveId(body!.taskId, "taskId"), vendorId = positiveId(body!.vendorId, "vendorId");
        await loadTask(taskId, actor);
        const result = await requestContact(taskId, vendorId, actor);
        await log("request_contact", `deal:${result.id}`);
        return ok(result);
      }
      case "deals": {
        const taskId = actor.role === "factory" ? queryId(params.get("taskId"), "taskId") : undefined;
        if (taskId !== undefined) await loadTask(taskId, actor);
        const result = await listDeals(actor, taskId);
        await log("list_deals", taskId ? `task:${taskId}` : `vendor:${actor.vendorId}`);
        return ok(result);
      }
      case "deal": {
        const result = await getDeal(id!, actor);
        await log("view_deal", `deal:${id}`);
        return ok(result);
      }
      case "accept": {
        const result = await acceptDeal(id!, actor);
        await log("accept", `deal:${id}`);
        return ok(result);
      }
      case "contract": {
        const price = body!.price;
        if (typeof price !== "number" || !Number.isSafeInteger(price) || price < 0) throw new ApiError(400, "가격은 0 이상의 원 단위 정수여야 합니다");
        const result = await saveContract(id!, actor, { price, purpose: requiredText(body!.purpose, 100),
          period: requiredText(body!.period, 100), scope: requiredText(body!.scope, 100), delivery: requiredText(body!.delivery, 100) });
        await log("save_contract", `deal:${id}`);
        return ok(result);
      }
      case "advance": {
        const result = await advanceStage(id!, actor);
        await log("advance_stage", `deal:${id}`);
        return ok(result);
      }
      case "access_log": {
        await log("view_access_log", "access-log");
        const rows = await query<{ ID: number; AT: Date; ROLE: "factory" | "startup"; ACTOR: string; ACTION: AccessAction; TARGET: string | null }>(
          "SELECT id, FROM_TZ(at, DBTIMEZONE) AS at, role, actor, action, target FROM access_log ORDER BY at, id",
        );
        return ok<AccessLog>({ rawDownloadCount: rows.filter((r) => r.ACTION === "raw_download").length,
          items: rows.map((r) => ({ id: r.ID, at: dbDateTime(r.AT)!, role: r.ROLE, actor: r.ACTOR, action: r.ACTION, target: r.TARGET })) });
      }
    }
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === 1 && action === "request_contact") return apiErrorResponse(new ApiError(409, "이미 연락을 요청했습니다"));
    if (code === 20001) return apiErrorResponse(new ApiError(409, "상태가 변경됐습니다. 새로고침 후 다시 시도해 주세요"));
    return apiErrorResponse(error);
  }
}
