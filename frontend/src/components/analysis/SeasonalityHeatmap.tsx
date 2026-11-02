import { useEffect, useState } from "react";
import { getProviderKey } from "../../services/marketOverview";
import { fetchHistoryByPeriod } from "../../services/marketData";

const FINNHUB = "https://finnhub.io/api/v1";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface Props {
  ticker: string;
}

export default function SeasonalityHeatmap({ ticker }: Props) {
  const [monthlyAvg, setMonthlyAvg] = useState<(number | null)[]>(
    Array(12).fill(null)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const key = getProviderKey("finnhub");
      let monthReturns: number[][] = Array.from({ length: 12 }, () => []);

      // Try Finnhub monthly candles first
      if (key) {
        try {
          const to = Math.floor(Date.now() / 1000);
          const from = to - 5 * 365 * 86400;
          const url = `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=M&from=${from}&to=${to}&token=${key}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (res.ok && !cancelled) {
            const data = await res.json();
            if (data.s === "ok" && data.c && data.o) {
              for (let i = 0; i < data.t.length; i++) {
                const month = new Date(data.t[i] * 1000).getMonth();
                const ret = ((data.c[i] - data.o[i]) / data.o[i]) * 100;
                monthReturns[month].push(ret);
              }
            }
          }
        } catch {
          // fall through
        }
      }

      // Fallback: compute monthly returns from daily data
      const hasData = monthReturns.some((arr) => arr.length > 0);
      if (!hasData && !cancelled) {
        try {
          const pts = await fetchHistoryByPeriod(ticker, "5y");
          let prevMonth = -1;
          let monthOpen = 0;
          for (const p of pts) {
            const month = new Date(p.date).getMonth();
            if (month !== prevMonth) {
              if (prevMonth !== -1 && monthOpen > 0) {
                const lastClose = pts[pts.indexOf(p) - 1]?.close ?? p.close;
                monthReturns[prevMonth].push(
                  ((lastClose - monthOpen) / monthOpen) * 100
                );
              }
              monthOpen = p.open;
              prevMonth = month;
            }
          }
          if (prevMonth !== -1 && monthOpen > 0) {
            const lastPt = pts[pts.length - 1];
            monthReturns[prevMonth].push(
              ((lastPt.close - monthOpen) / monthOpen) * 100
            );
          }
        } catch {
          // give up
        }
      }

      if (cancelled) return;

      const avgs = monthReturns.map((arr) =>
        arr.length > 0
          ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) /
            10
          : null
      );

      setMonthlyAvg(avgs);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  function getBg(pct: number): string {
    if (pct >= 4) return "bg-green-600 text-white";
    if (pct >= 2) return "bg-green-600/70 text-green-100";
    if (pct >= 1) return "bg-green-600/40 text-green-200";
    if (pct >= 0) return "bg-t-green-bg text-t-green";
    if (pct >= -1) return "bg-t-red-bg text-t-red";
    if (pct >= -2) return "bg-red-600/40 text-red-200";
    if (pct >= -4) return "bg-red-600/70 text-red-100";
    return "bg-red-600 text-white";
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-3 space-y-2">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Seasonality — {ticker} (5Y Avg Monthly Return)
      </h3>
      {loading ? (
        <div className="h-12 bg-t-input rounded animate-pulse" />
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
          {MONTHS.map((m, i) => (
            <div
              key={m}
              className={`rounded p-2 text-center ${
                monthlyAvg[i] !== null ? getBg(monthlyAvg[i]!) : "bg-t-input"
              }`}
            >
              <p className="text-[8px] font-medium opacity-70">{m}</p>
              <p className="text-[11px] font-bold">
                {monthlyAvg[i] !== null
                  ? `${monthlyAvg[i]! >= 0 ? "+" : ""}${monthlyAvg[i]}%`
                  : "--"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
