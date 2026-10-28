import type {
  BacktestRequest,
  BacktestResult,
  Holding,
  HoldingCreate,
  PortfolioSummary,
  PricePoint,
} from "../types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getHoldings: () => request<Holding[]>("/holdings"),

  createHolding: (data: HoldingCreate) =>
    request<Holding>("/holdings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateHolding: (id: number, data: Partial<HoldingCreate>) =>
    request<Holding>(`/holdings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteHolding: (id: number) =>
    request<void>(`/holdings/${id}`, { method: "DELETE" }),

  getPortfolioSummary: () => request<PortfolioSummary>("/portfolio/summary"),

  getPriceHistory: (ticker: string, period = "1y") =>
    request<PricePoint[]>(`/market/${ticker}/history?period=${period}`),

  runBacktest: (data: BacktestRequest) =>
    request<BacktestResult>("/backtest", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
