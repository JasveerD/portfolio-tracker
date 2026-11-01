import { useEffect, useRef, useState } from "react";
import {
  INDICES,
  fetchTickerQuoteWithRetry,
  needsDelay,
  type TickerQuote,
} from "../services/marketOverview";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  onDone?: () => void;
}

export default function MarketIndices({ onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [quotes, setQuotes] = useState<TickerQuote[]>(
    INDICES.map((i) => ({
      ...i,
      price: 0,
      change: 0,
      changePct: 0,
      loading: true,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      for (let i = 0; i < INDICES.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            INDICES[i].ticker,
            INDICES[i].name
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
        if (i < INDICES.length - 1 && !cancelled && needsDelay()) await delay(8000);
      }
      if (!cancelled) onDoneRef.current?.();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {quotes.map((q) => (
        <div
          key={q.ticker}
          className="bg-t-panel border border-t-border rounded p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-t-muted tracking-wider">
              {q.ticker}
            </span>
            {!q.loading && !q.error && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  q.change >= 0
                    ? "bg-t-green-bg text-t-green"
                    : "bg-t-red-bg text-t-red"
                }`}
              >
                {q.change >= 0 ? "+" : ""}
                {q.changePct.toFixed(2)}%
              </span>
            )}
          </div>
          <p className="text-xs text-t-muted mb-1">{q.name}</p>
          {q.loading ? (
            <div className="h-6 bg-t-input rounded animate-pulse" />
          ) : q.error ? (
            <p className="text-xs text-t-red">Failed to load</p>
          ) : (
            <p className="text-lg font-bold">
              $
              {q.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          )}
          {!q.loading && !q.error && (
            <p
              className={`text-[10px] mt-0.5 ${
                q.change >= 0 ? "text-t-green" : "text-t-red"
              }`}
            >
              {q.change >= 0 ? "+" : ""}
              {q.change.toFixed(2)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
