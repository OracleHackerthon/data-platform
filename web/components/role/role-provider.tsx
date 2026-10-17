"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Role } from "@/lib/types";

// 데모에서 창 두 개(공장·스타트업)를 동시에 띄우도록 역할은 탭마다 sessionStorage 에 둔다.
const storageKey = "manufacturing-demo-role";
const defaultState = '{"role":"factory","vendorId":2}';
let fallback = defaultState;
function subscribe(callback: () => void) {
  window.addEventListener("demo-role", callback);
  return () => {
    window.removeEventListener("demo-role", callback);
  };
}
function snapshot() {
  try { return sessionStorage.getItem(storageKey) ?? fallback; } catch { return fallback; }
}
function parse(value: string) {
  try {
    const state = JSON.parse(value);
    return { role: state.role === "startup" ? "startup" as const : "factory" as const, vendorId: [1, 2, 3, 4].includes(state.vendorId) ? state.vendorId as number : 2 };
  } catch { return { role: "factory" as const, vendorId: 2 }; }
}
type RoleContextValue = {
  role: Role; vendorId: number; ready: boolean; query: string;
  setRole: (role: Role) => void; setVendorId: (id: number) => void;
};
const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const value = useSyncExternalStore(subscribe, snapshot, () => defaultState);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const state = useMemo(() => parse(value), [value]);
  function save(next: typeof state) {
    fallback = JSON.stringify(next);
    try { sessionStorage.setItem(storageKey, fallback); } catch { /* 저장이 차단되어도 현재 탭에서는 역할 전환을 유지한다. */ }
    window.dispatchEvent(new Event("demo-role"));
  }
  return <RoleContext.Provider value={{ ...state, ready,
    query: state.role === "factory" ? "role=factory" : `role=startup&vendorId=${state.vendorId}`,
    setRole: (role) => save({ ...parse(snapshot()), role }),
    setVendorId: (vendorId) => { if ([1, 2, 3, 4].includes(vendorId)) save({ ...parse(snapshot()), vendorId }); },
  }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error("RoleProvider가 필요합니다");
  return value;
}
