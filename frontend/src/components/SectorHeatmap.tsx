import { useEffect, useState } from "react";
import {
  SECTORS,
  fetchTickerQuoteWithRetry,
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
        if (i < SECTORS.length - 1 && !cancelled) await delay(8000);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startLoading]);

  function getBg(pct: number): string {
    if (pct >= 2) return "bg-green-600 text-white";
    if (pct >= 1) return "bg-green-500 text-white";
    if (pct >= 0.5) return "bg-green-400 text-white";
    if (pct >= 0)
      return "bg-green-300 dark:bg-green-800 text-green-900 dark:text-green-100";
    if (pct >= -0.5)
      return "bg-red-300 dark:bg-red-800 text-red-900 dark:text-red-100";
    if (pct >= -1) return "bg-red-400 text-white";
    if (pct >= -2) return "bg-red-500 text-white";
    return "bg-red-600 text-white";
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Sector Performance</h3>
        {loaded < SECTORS.length && (
          <span className="text-xs text-gray-400">
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
            className={`rounded-lg p-3 text-center transition-colors ${
              s.loading
                ? "bg-gray-100 dark:bg-gray-700"
                : s.error
                ? "bg-gray-200 dark:bg-gray-700"
                : getBg(s.changePct)
            }`}
          >
            <p
              className={`text-xs font-medium ${
                s.loading || s.error
                  ? "text-gray-500 dark:text-gray-400"
                  : ""
              }`}
            >
              {s.name}
            </p>
            {s.loading ? (
              <div className="h-5 mt-1 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mx-auto w-12" />
            ) : s.error ? (
              <p className="text-xs text-red-400 mt-1">--</p>
            ) : (
              <p className="text-sm font-bold mt-0.5">
                {s.changePct >= 0 ? "+" : ""}
                {s.changePct.toFixed(2)}%
              </p>
            )}
            <p className="text-[10px] mt-0.5 opacity-70">{s.ticker}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
