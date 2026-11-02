import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getProviderKey } from "../../services/marketOverview";
import { fetchHistoryByPeriod } from "../../services/marketData";

const FINNHUB = "https://finnhub.io/api/v1";

interface Props {
  ticker: string;
}

export default function RelativeStrength({ ticker }: Props) {
  const [compare, setCompare] = useState("SPY");
  const [data, setData] = useState<{ date: string; ratio: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("SPY");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const key = getProviderKey("finnhub");
      let closes1: number[] = [];
      let closes2: number[] = [];
      let dates1: string[] = [];
      let dates2: string[] = [];

      if (key) {
        try {
          const to = Math.floor(Date.now() / 1000);
          const from = to - 180 * 86400;

          const [res1, res2] = await Promise.all([
            fetch(
              `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${key}`,
              { signal: AbortSignal.timeout(15000) }
            ),
            fetch(
              `${FINNHUB}/stock/candle?symbol=${compare}&resolution=D&from=${from}&to=${to}&token=${key}`,
              { signal: AbortSignal.timeout(15000) }
            ),
          ]);

          if (cancelled) return;
          if (res1.ok && res2.ok) {
            const d1 = await res1.json();
            const d2 = await res2.json();
            if (d1.s === "ok" && d2.s === "ok" && d1.c && d2.c) {
              closes1 = d1.c;
              closes2 = d2.c;
              dates1 = d1.t.map((ts: number) => new Date(ts * 1000).toISOString().slice(0, 10));
              dates2 = d2.t.map((ts: number) => new Date(ts * 1000).toISOString().slice(0, 10));
            }
          }
        } catch {
          // fall through to Twelve Data
        }
      }

      // Fallback to Twelve Data
      if (closes1.length === 0) {
        try {
          const [pts1, pts2] = await Promise.all([
            fetchHistoryByPeriod(ticker, "6mo"),
            fetchHistoryByPeriod(compare, "6mo"),
          ]);
          if (cancelled) return;
          closes1 = pts1.map((p) => p.close);
          closes2 = pts2.map((p) => p.close);
          dates1 = pts1.map((p) => p.date);
          dates2 = pts2.map((p) => p.date);
        } catch {
          if (!cancelled) setLoading(false);
          return;
        }
      }

      if (cancelled || closes1.length < 5 || closes2.length < 5) {
        if (!cancelled) setLoading(false);
        return;
      }

      const map2 = new Map<string, number>();
      dates2.forEach((d, i) => map2.set(d, closes2[i]));

      const base1 = closes1[0];
      const base2 = map2.get(dates1[0]) || closes2[0];

      const points: { date: string; ratio: number }[] = [];
      const step = Math.max(1, Math.floor(dates1.length / 80));

      for (let i = 0; i < dates1.length; i += step) {
        const d = dates1[i];
        const c2 = map2.get(d);
        if (c2 === undefined) continue;

        const norm1 = closes1[i] / base1;
        const norm2 = c2 / base2;
        const ratio = norm2 > 0 ? (norm1 / norm2 - 1) * 100 : 0;

        points.push({
          date: d.slice(5, 10),
          ratio: Math.round(ratio * 10) / 10,
        });
      }

      if (!cancelled) {
        setData(points);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker, compare]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) setCompare(input.trim().toUpperCase());
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Relative Strength — {ticker} vs {compare}
        </h3>
        <form onSubmit={handleSubmit} className="flex items-center gap-1">
          <span className="text-[9px] text-t-muted">vs</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="w-16 px-1.5 py-0.5 rounded border border-t-border bg-t-input text-[10px] focus:outline-none focus:border-t-accent"
          />
          <button
            type="submit"
            className="text-[9px] text-t-accent hover:text-t-text px-1"
          >
            GO
          </button>
        </form>
      </div>

      {loading ? (
        <div className="h-28 bg-t-input rounded animate-pulse" />
      ) : data.length === 0 ? (
        <p className="text-[10px] text-t-muted">No data available.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <CartesianGrid stroke="#1a1f26" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                interval={Math.floor(data.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                width={35}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b0e11",
                  border: "1px solid #1e2530",
                  fontSize: 10,
                }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, ""]}
              />
              <ReferenceLine y={0} stroke="#4b5563" />
              <Line
                dataKey="ratio"
                stroke="#f0a030"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[9px] text-t-muted text-center">
            Above 0% = {ticker} outperforming {compare} | Below 0% ={" "}
            {compare} outperforming
          </p>
        </>
      )}
    </div>
  );
}
