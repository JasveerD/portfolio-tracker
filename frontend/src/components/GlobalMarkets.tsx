import { useEffect, useRef, useState } from "react";
import {
  GLOBAL_MARKETS,
  fetchTickerQuoteWithRetry,
  needsDelay,
  type TickerQuote,
} from "../services/marketOverview";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FLAGS: Record<string, string> = {
  INDA: "IN",
  EWJ: "JP",
  FXI: "CN",
  VGK: "EU",
  EWU: "GB",
  EWZ: "BR",
};

interface Props {
  startLoading?: boolean;
  onDone?: () => void;
}

export default function GlobalMarkets({
  startLoading = true,
  onDone,
}: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [quotes, setQuotes] = useState<TickerQuote[]>(
    GLOBAL_MARKETS.map((m) => ({
      ...m,
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
      for (let i = 0; i < GLOBAL_MARKETS.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            GLOBAL_MARKETS[i].ticker,
            GLOBAL_MARKETS[i].name
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
        if (i < GLOBAL_MARKETS.length - 1 && !cancelled && needsDelay())
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
        Global Markets
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {quotes.map((q) => (
          <div
            key={q.ticker}
            className="bg-t-bg border border-t-border rounded p-2.5 text-center"
          >
            <p className="text-[10px] text-t-muted mb-0.5">
              {FLAGS[q.ticker] || ""} {q.name}
            </p>
            {q.loading ? (
              <div className="h-5 bg-t-input rounded animate-pulse mx-auto w-14 mt-1" />
            ) : q.error ? (
              <p className="text-[10px] text-t-red mt-1">--</p>
            ) : (
              <>
                <p className="text-sm font-bold">${q.price.toFixed(2)}</p>
                <p
                  className={`text-[10px] font-semibold ${
                    q.changePct >= 0 ? "text-t-green" : "text-t-red"
                  }`}
                >
                  {q.changePct >= 0 ? "+" : ""}
                  {q.changePct.toFixed(2)}%
                </p>
              </>
            )}
            <p className="text-[8px] text-t-muted/50 mt-0.5">{q.ticker}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
