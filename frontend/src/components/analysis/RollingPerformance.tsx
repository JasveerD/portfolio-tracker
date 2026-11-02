import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getProviderKey } from "../../services/marketOverview";

const FINNHUB = "https://finnhub.io/api/v1";

interface DataPoint {
  date: string;
  rolling30: number | null;
  rolling90: number | null;
  spyRolling30: number | null;
}

async function fetchCandles(
  ticker: string,
  key: string
): Promise<{ dates: string[]; closes: number[] }> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 365 * 86400;
  const url = `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { dates: [], closes: [] };
  const data = await res.json();
  if (data.s !== "ok" || !data.c) return { dates: [], closes: [] };
  return {
    dates: data.t.map((ts: number) =>
      new Date(ts * 1000).toISOString().slice(0, 10)
    ),
    closes: data.c,
  };
}

function rollingReturn(closes: number[], period: number): (number | null)[] {
  return closes.map((c, i) =>
    i >= period ? ((c - closes[i - period]) / closes[i - period]) * 100 : null
  );
}

interface Props {
  ticker: string;
}

export default function RollingPerformance({ ticker }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);
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

      const [tickerData, spyData] = await Promise.all([
        fetchCandles(ticker, key),
        fetchCandles("SPY", key),
      ]);

      if (cancelled) return;

      if (!tickerData.closes.length) {
        setLoading(false);
        return;
      }

      const r30 = rollingReturn(tickerData.closes, 30);
      const r90 = rollingReturn(tickerData.closes, 90);

      const spyMap = new Map<string, number>();
      const spy30 = rollingReturn(spyData.closes, 30);
      spyData.dates.forEach((d, i) => {
        if (spy30[i] !== null) spyMap.set(d, spy30[i]!);
      });

      const points: DataPoint[] = [];
      const step = Math.max(1, Math.floor(tickerData.dates.length / 80));
      for (let i = 0; i < tickerData.dates.length; i += step) {
        points.push({
          date: tickerData.dates[i].slice(5),
          rolling30: r30[i] !== null ? Math.round(r30[i]! * 10) / 10 : null,
          rolling90: r90[i] !== null ? Math.round(r90[i]! * 10) / 10 : null,
          spyRolling30: spyMap.get(tickerData.dates[i]) ?? null,
        });
      }

      setData(points);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-3">
        <div className="h-32 bg-t-input rounded animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="bg-t-panel border border-t-border rounded p-3 space-y-2">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Rolling Returns — {ticker} vs SPY
      </h3>
      <ResponsiveContainer width="100%" height={140}>
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
          <Legend
            wrapperStyle={{ fontSize: 9, color: "#6b7280" }}
            iconSize={8}
          />
          <Line
            dataKey="rolling30"
            name={`${ticker} 30D`}
            stroke="#f0a030"
            dot={false}
            strokeWidth={1.5}
            connectNulls
          />
          <Line
            dataKey="rolling90"
            name={`${ticker} 90D`}
            stroke="#a855f7"
            dot={false}
            strokeWidth={1}
            connectNulls
          />
          <Line
            dataKey="spyRolling30"
            name="SPY 30D"
            stroke="#6b7280"
            dot={false}
            strokeWidth={1}
            strokeDasharray="4 2"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
