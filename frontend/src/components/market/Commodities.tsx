import { useEffect, useRef, useState } from "react";
import {
  COMMODITIES,
  fetchTickerQuoteWithRetry,
  needsDelay,
  type TickerQuote,
} from "../../services/marketOverview";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  startLoading?: boolean;
  onDone?: () => void;
}

export default function CommoditiesPanel({
  startLoading = true,
  onDone,
}: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [quotes, setQuotes] = useState<TickerQuote[]>(
    COMMODITIES.map((c) => ({
      ...c,
      price: 0,
      change: 0,
      changePct: 0,
      loading: true,
    }))
  );

  useEffect(() => {
    if (!startLoading) return;
    let cancelled = false;

    async function load() {
      for (let i = 0; i < COMMODITIES.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            COMMODITIES[i].ticker,
            COMMODITIES[i].name
          );
          if (!cancelled) {
            setQuotes((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...q, loading: false } : p
              )
            );
          }
        } catch {
          if (!cancelled) {
            setQuotes((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, loading: false, error: true } : p
              )
            );
          }
        }
        if (i < COMMODITIES.length - 1 && !cancelled && needsDelay())
          await wait(8000);
      }
      if (!cancelled) onDoneRef.current?.();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startLoading]);

  return (
    <div className="bg-t-panel border border-t-border rounded p-4">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-3">
        Commodities
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {quotes.map((q) => (
          <div key={q.ticker} className="bg-t-bg border border-t-border rounded p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-t-muted tracking-wider">
                {q.ticker}
              </span>
              {!q.loading && !q.error && (
                <span
                  className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                    q.changePct >= 0
                      ? "bg-t-green-bg text-t-green"
                      : "bg-t-red-bg text-t-red"
                  }`}
                >
                  {q.changePct >= 0 ? "+" : ""}
                  {q.changePct.toFixed(2)}%
                </span>
              )}
            </div>
            <p className="text-xs text-t-accent font-medium mb-0.5">
              {q.name}
            </p>
            {q.loading ? (
              <div className="h-5 bg-t-input rounded animate-pulse" />
            ) : q.error ? (
              <p className="text-[10px] text-t-red">--</p>
            ) : (
              <p className="text-sm font-bold">
                $
                {q.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
