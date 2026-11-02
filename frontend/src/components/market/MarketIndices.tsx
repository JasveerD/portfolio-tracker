import { useEffect, useRef, useState } from "react";
import {
  INDICES,
  fetchTickerQuoteWithRetry,
  fetchSparklineData,
  needsDelay,
  type TickerQuote,
} from "../../services/marketOverview";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = data[data.length - 1] >= data[0] ? "#3fb950" : "#f85149";
  return (
    <svg width={w} height={h} className="mt-1.5">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const sparklinesFetched = useRef(false);

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
        if (i < INDICES.length - 1 && !cancelled && needsDelay())
          await wait(8000);
      }
      if (!cancelled) onDoneRef.current?.();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allLoaded = quotes.every((q) => !q.loading);

  useEffect(() => {
    if (!allLoaded || sparklinesFetched.current) return;
    sparklinesFetched.current = true;

    INDICES.forEach(async (idx) => {
      const data = await fetchSparklineData(idx.ticker);
      if (data.length > 0) {
        setSparklines((prev) => ({ ...prev, [idx.ticker]: data }));
      }
    });
  }, [allLoaded]);

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
            <>
              <p className="text-lg font-bold">
                $
                {q.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="flex items-center justify-between">
                <p
                  className={`text-[10px] ${
                    q.change >= 0 ? "text-t-green" : "text-t-red"
                  }`}
                >
                  {q.change >= 0 ? "+" : ""}
                  {q.change.toFixed(2)}
                </p>
                {sparklines[q.ticker] && (
                  <Sparkline data={sparklines[q.ticker]} />
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
