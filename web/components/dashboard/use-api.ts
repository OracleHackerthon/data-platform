"use client";

import { useEffect, useState } from "react";

export async function requestApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options, signal: options?.signal ?? AbortSignal.timeout(65000) });
  const result = await response.json();
  if (!response.ok || !result.ok || result.data === undefined) throw new Error("요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return result.data as T;
}

export function useApi<T>(url: string | null) {
  const [version, setVersion] = useState(0);
  const key = `${url}:${version}`;
  const [state, setState] = useState<{ key: string; data: T | null; error: boolean }>({ key: "", data: null, error: false });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let refreshing = false;
    const load = (silent: boolean) => requestApi<T>(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]) })
      .then((data) => { if (!controller.signal.aborted) setState({ key, data, error: false }); })
      .catch(() => { if (!controller.signal.aborted && !silent) setState({ key, data: null, error: true }); });
    load(false);
    // 데모는 공장·스타트업 창 두 개를 오간다. 창으로 돌아오면 로딩 표시 없이 최신 데이터로 바꾸고, 실패하면 이전 데이터를 둔다.
    const refresh = () => {
      if (refreshing || document.visibilityState !== "visible") return;
      refreshing = true;
      load(true).finally(() => { refreshing = false; });
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [url, key]);
  return { data: state.key === key ? state.data : null, error: state.key === key && state.error,
    loading: !!url && state.key !== key, reload: () => setVersion((n) => n + 1),
    update: (data: T) => setState({ key, data, error: false }) };
}
