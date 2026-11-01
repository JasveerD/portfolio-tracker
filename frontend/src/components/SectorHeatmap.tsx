import { useEffect, useState } from "react";
import {
  SECTORS,
  fetchTickerQuoteWithRetry,
  needsDelay,
  type TickerQuote,
} from "../services/marketOverview";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  startLoading?: boolean;
}

export default function SectorHeatmap({ startLoading = true }: Props) {
  const [sectors, setSectors] = useState<TickerQuote[]>(
    SECTORS.map((s) => ({
      ...s,
      price: 0,
      change: 0,
      changePct: 0,
      loading: true,
    }))
  );
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    if (!startLoading) return;
    let cancelled = false;

    async function load() {
      for (let i = 0; i < SECTORS.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            SECTORS[i].ticker,
            SECTORS[i].name
          );
          if (!cancelled) {
            setSectors((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...q, loading: false } : p
              )
            );
            setLoaded((n) => n + 1);
          }
        } catch {
          if (!cancelled) {
            setSectors((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, loading: false, error: true } : p
              )
            );
            setLoaded((n) => n + 1);
          }
        }
        if (i < SECTORS.length - 1 && !cancelled && needsDelay()) await delay(8000);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startLoading]);

  function getBg(pct: number): string {
    if (pct >= 2) return "bg-green-700 text-green-100";
    if (pct >= 1) return "bg-green-600/80 text-green-100";
    if (pct >= 0.5) return "bg-green-600/50 text-green-200";
    if (pct >= 0) return "bg-t-green-bg text-t-green";
    if (pct >= -0.5) return "bg-t-red-bg text-t-red";
    if (pct >= -1) return "bg-red-600/50 text-red-200";
    if (pct >= -2) return "bg-red-600/80 text-red-100";
    return "bg-red-700 text-red-100";
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Sector Performance
        </h3>
        {loaded < SECTORS.length && (
          <span className="text-[10px] text-t-muted">
            {startLoading
              ? `Loading ${loaded}/${SECTORS.length}...`
              : "Waiting for indices..."}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {sectors.map((s) => (
          <div
            key={s.ticker}
            className={`rounded p-2.5 text-center transition-colors ${
              s.loading
                ? "bg-t-input"
                : s.error
                ? "bg-t-input"
                : getBg(s.changePct)
            }`}
          >
            <p
              className={`text-[10px] font-medium ${
                s.loading || s.error ? "text-t-muted" : ""
              }`}
            >
              {s.name}
            </p>
            {s.loading ? (
              <div className="h-4 mt-1 bg-t-border rounded animate-pulse mx-auto w-10" />
            ) : s.error ? (
              <p className="text-[10px] text-t-red mt-1">--</p>
            ) : (
              <p className="text-xs font-bold mt-0.5">
                {s.changePct >= 0 ? "+" : ""}
                {s.changePct.toFixed(2)}%
              </p>
            )}
            <p className="text-[9px] mt-0.5 opacity-60">{s.ticker}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
