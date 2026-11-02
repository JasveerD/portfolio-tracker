import { useEffect, useState } from "react";
import {
  POPULAR_STOCKS,
  fetchTickerQuoteWithRetry,
  needsDelay,
  type TickerQuote,
} from "../../services/marketOverview";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  startLoading?: boolean;
}

export default function MarketMovers({ startLoading = true }: Props) {
  const [stocks, setStocks] = useState<(TickerQuote & { loading?: boolean })[]>(
    POPULAR_STOCKS.map((s) => ({
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
      for (let i = 0; i < POPULAR_STOCKS.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            POPULAR_STOCKS[i].ticker,
            POPULAR_STOCKS[i].name
          );
          if (!cancelled) {
            setStocks((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...q, loading: false } : p
              )
            );
            setLoaded((n) => n + 1);
          }
        } catch {
          if (!cancelled) {
            setStocks((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, loading: false, error: true } : p
              )
            );
            setLoaded((n) => n + 1);
          }
        }
        if (i < POPULAR_STOCKS.length - 1 && !cancelled && needsDelay())
          await delay(8000);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startLoading]);

  const done = stocks.filter((s) => !s.loading && !s.error);
  const gainers = [...done].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...done].sort((a, b) => a.changePct - b.changePct).slice(0, 5);

  return (
    <div className="bg-t-panel border border-t-border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Market Movers
        </h3>
        {loaded < POPULAR_STOCKS.length && (
          <span className="text-[10px] text-t-muted">
            {startLoading
              ? `${loaded}/${POPULAR_STOCKS.length}`
              : "Waiting..."}
          </span>
        )}
      </div>

      {done.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 bg-t-input rounded animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] text-t-green tracking-wider uppercase mb-2 font-semibold">
              Gainers
            </p>
            <div className="space-y-1">
              {gainers.map((s) => (
                <div
                  key={s.ticker}
                  className="flex items-center justify-between py-1 border-b border-t-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-t-accent">
                      {s.ticker}
                    </span>
                    <span className="text-[10px] text-t-muted hidden sm:inline">
                      ${s.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-t-green">
                    +{s.changePct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] text-t-red tracking-wider uppercase mb-2 font-semibold">
              Losers
            </p>
            <div className="space-y-1">
              {losers.map((s) => (
                <div
                  key={s.ticker}
                  className="flex items-center justify-between py-1 border-b border-t-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-t-accent">
                      {s.ticker}
                    </span>
                    <span className="text-[10px] text-t-muted hidden sm:inline">
                      ${s.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-t-red">
                    {s.changePct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
