import { query } from "@/lib/db";
import type { Deal, ContractTerms } from "@/lib/types";
import type { RequestActor } from "./actor";
import { ApiError } from "./api-error";
import { dbDateTime } from "./db-values";

type DealRow = {
  ID: number; TASK_ID: number; TASK_TITLE: string; VENDOR_ID: number; VENDOR_ALIAS: string;
  STATUS: Deal["status"]; STAGE: Deal["stage"]; CREATED_AT: Date;
  PRICE: number | null; PURPOSE: string | null; PERIOD: string | null; SCOPE: string | null; DELIVERY: string | null;
  PRICE_MIN: number | null; PRICE_MAX: number | null; VALUE_INDEX: number | null;
  FACTORY_NAME: string; FACTORY_CONTACT: string; REAL_NAME: string; CONTACT: string;
};
const dealSelect = `SELECT d.id, d.task_id, d.vendor_id, d.status, d.stage, d.price, d.purpose,
  d.period, d.scope, d.delivery, FROM_TZ(d.created_at, DBTIMEZONE) AS created_at,
  t.title AS task_title, t.value_index, v.alias AS vendor_alias,
  ds.factory_name, ds.factory_contact, ds.price_min, ds.price_max, v.real_name, v.contact
  FROM deals d JOIN tasks t ON t.id = d.task_id
  JOIN datasets ds ON ds.id = t.dataset_id JOIN vendors v ON v.id = d.vendor_id`;

function response(row: DealRow, actor: RequestActor): Deal {
  const min = row.PRICE_MIN, max = row.PRICE_MAX, index = row.VALUE_INDEX;
  let priceGuide: Deal["priceGuide"] = null;
  if (actor.role === "factory" && index !== null && min !== null && max !== null) {
    const center = min + (max - min) * (index - 300) / 700;
    const price = (v: number) => Math.min(max, Math.max(min, Math.round(v / 10_000) * 10_000));
    priceGuide = { min, max, recommendedLow: price(center - (max - min) * 0.1), recommendedHigh: price(center + (max - min) * 0.1), valueIndex: index };
  }
  return { id: row.ID, taskId: row.TASK_ID, taskTitle: row.TASK_TITLE, vendorId: row.VENDOR_ID,
    vendorAlias: row.VENDOR_ALIAS, status: row.STATUS, stage: row.STAGE, createdAt: dbDateTime(row.CREATED_AT)!,
    contract: row.STATUS === "contracted" ? { price: row.PRICE!, purpose: row.PURPOSE!, period: row.PERIOD!, scope: row.SCOPE!, delivery: row.DELIVERY! } : null,
    priceGuide, parties: row.STATUS === "requested" ? null : {
      factory: { name: row.FACTORY_NAME, contact: row.FACTORY_CONTACT }, vendor: { name: row.REAL_NAME, contact: row.CONTACT } } };
}

export async function getDeal(id: number, actor: RequestActor): Promise<Deal> {
  const rows = await query<DealRow>(`${dealSelect} WHERE d.id = :id`, { id });
  if (!rows.length) throw new ApiError(404, "거래를 찾을 수 없습니다");
  if (actor.role === "startup" && rows[0].VENDOR_ID !== actor.vendorId) throw new ApiError(403, "이 거래에 접근할 수 없습니다");
  return response(rows[0], actor);
}

export async function listDeals(actor: RequestActor, taskId?: number): Promise<Deal[]> {
  const rows = await query<DealRow>(`${dealSelect}
    WHERE ${actor.role === "factory" ? "d.task_id = :filterId" : "d.vendor_id = :filterId"}
    ORDER BY d.created_at DESC, d.id DESC`, { filterId: actor.role === "factory" ? taskId! : actor.vendorId });
  return rows.map((r) => response(r, actor));
}

export async function requestContact(taskId: number, vendorId: number, actor: RequestActor): Promise<Deal> {
  const vendors = await query<{ ID: number }>("SELECT id FROM vendors WHERE id = :vendorId", { vendorId });
  if (!vendors.length) throw new ApiError(404, "업체를 찾을 수 없습니다");
  const rows = await query<{ ID: number }>(
    `DECLARE v_id NUMBER; v_rows SYS_REFCURSOR;
     BEGIN
       INSERT INTO deals (task_id, vendor_id) VALUES (:taskId, :vendorId) RETURNING id INTO v_id;
       OPEN v_rows FOR SELECT id FROM deals WHERE id = v_id;
       DBMS_SQL.RETURN_RESULT(v_rows);
     END;`, { taskId, vendorId },
  );
  if (!rows.length) throw new ApiError(500, "연락 요청 결과를 확인할 수 없습니다");
  return getDeal(rows[0].ID, actor);
}

export async function acceptDeal(id: number, actor: RequestActor): Promise<Deal> {
  const deal = await getDeal(id, actor);
  if (deal.status !== "requested") throw new ApiError(409, "연락 요청 상태에서만 수락할 수 있습니다");
  await query(
    `BEGIN
       UPDATE deals SET status = 'accepted' WHERE id = :id AND vendor_id = :vendorId AND status = 'requested';
       IF SQL%ROWCOUNT <> 1 THEN RAISE_APPLICATION_ERROR(-20001, 'Deal state changed'); END IF;
     END;`, { id, vendorId: actor.vendorId! },
  );
  return getDeal(id, actor);
}

// 10/17 시연용: 결제 없이 입금 대기 → 격리 환경 접근 허용 → 정산 완료로 한 단계씩 넘긴다 (공장만).
const nextStage: Partial<Record<Deal["stage"], Deal["stage"]>> = { payment_pending: "access_granted", access_granted: "settled" };

export async function advanceStage(id: number, actor: RequestActor): Promise<Deal> {
  const deal = await getDeal(id, actor);
  const next = nextStage[deal.stage];
  if (deal.status !== "contracted" || !next) throw new ApiError(409, "계약 뒤 입금 대기·접근 허용 단계에서만 다음 단계로 넘길 수 있습니다");
  await query(
    `BEGIN
       UPDATE deals SET stage = :next WHERE id = :id AND status = 'contracted' AND stage = :current;
       IF SQL%ROWCOUNT <> 1 THEN RAISE_APPLICATION_ERROR(-20001, 'Deal state changed'); END IF;
     END;`, { id, next, current: deal.stage },
  );
  return getDeal(id, actor);
}

export async function saveContract(id: number, actor: RequestActor, terms: ContractTerms): Promise<Deal> {
  const deal = await getDeal(id, actor);
  if (deal.status !== "accepted") throw new ApiError(409, "수락된 거래에만 계약을 저장할 수 있습니다");
  await query(
    `BEGIN
       UPDATE deals SET status = 'contracted', stage = 'payment_pending', price = :price,
         purpose = :purpose, period = :period, scope = :scope, delivery = :delivery
       WHERE id = :id AND status = 'accepted';
       IF SQL%ROWCOUNT <> 1 THEN RAISE_APPLICATION_ERROR(-20001, 'Deal state changed'); END IF;
     END;`, { id, ...terms },
  );
  return getDeal(id, actor);
}
