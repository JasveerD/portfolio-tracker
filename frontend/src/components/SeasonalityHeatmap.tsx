import { useEffect, useState } from "react";
import { getProviderKey } from "../services/marketOverview";

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
      if (!key) {
        setLoading(false);
        return;
      }

      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 5 * 365 * 86400;
        const url = `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=M&from=${from}&to=${to}&token=${key}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.s !== "ok" || !data.c || !data.o) return;

        const monthReturns: number[][] = Array.from({ length: 12 }, () => []);
        for (let i = 0; i < data.t.length; i++) {
          const month = new Date(data.t[i] * 1000).getMonth();
          const ret = ((data.c[i] - data.o[i]) / data.o[i]) * 100;
          monthReturns[month].push(ret);
        }

        const avgs = monthReturns.map((arr) =>
          arr.length > 0
            ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) /
              10
            : null
        );

        if (!cancelled) {
          setMonthlyAvg(avgs);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const key = getProviderKey("finnhub");
  if (!key) return null;

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
