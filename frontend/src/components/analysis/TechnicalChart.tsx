import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { getProviderKey } from "../../services/marketOverview";

const FINNHUB = "https://finnhub.io/api/v1";

interface CandlePoint {
  date: string;
  close: number;
  sma20: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
  rsi: number | null;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

function computeIndicators(closes: number[], dates: string[]): CandlePoint[] {
  const points: CandlePoint[] = [];

  const sma = (arr: number[], period: number, idx: number): number | null => {
    if (idx < period - 1) return null;
    let sum = 0;
    for (let i = idx - period + 1; i <= idx; i++) sum += arr[i];
    return sum / period;
  };

  const ema = (arr: number[], period: number): number[] => {
    const result: number[] = [];
    const k = 2 / (period + 1);
    result[0] = arr[0];
    for (let i = 1; i < arr.length; i++) {
      result[i] = arr[i] * k + result[i - 1] * (1 - k);
    }
    return result;
  };

  // RSI
  const rsiValues: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      rsiValues.push(null);
      continue;
    }
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);

    if (i < 14) {
      rsiValues.push(null);
    } else if (i === 14) {
      let avgGain = 0,
        avgLoss = 0;
      for (let j = 1; j <= 14; j++) {
        avgGain += gains[j];
        avgLoss += losses[j];
      }
      avgGain /= 14;
      avgLoss /= 14;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    } else {
      const prevRsi = rsiValues[i - 1]!;
      const prevAvgGain = (100 / (100 - prevRsi) - 1) * 1;
      // Simplified: use EMA-style calculation
      let avgGain = 0,
        avgLoss = 0;
      for (let j = Math.max(1, i - 13); j <= i; j++) {
        avgGain += gains[j];
        avgLoss += losses[j];
      }
      avgGain /= 14;
      avgLoss /= 14;
      void prevAvgGain;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
  }

  // MACD
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = closes.map((_, i) =>
    i >= 25 ? ema12[i] - ema26[i] : 0
  );
  const signalLine = ema(macdLine, 9);

  for (let i = 0; i < closes.length; i++) {
    const sma20 = sma(closes, 20, i);
    let bb_upper: number | null = null;
    let bb_lower: number | null = null;

    if (sma20 !== null) {
      let variance = 0;
      for (let j = i - 19; j <= i; j++) {
        variance += (closes[j] - sma20) ** 2;
      }
      const stddev = Math.sqrt(variance / 20);
      bb_upper = sma20 + 2 * stddev;
      bb_lower = sma20 - 2 * stddev;
    }

    points.push({
      date: dates[i],
      close: closes[i],
      sma20,
      bb_upper,
      bb_lower,
      rsi: rsiValues[i],
      macd: i >= 25 ? macdLine[i] : null,
      signal: i >= 33 ? signalLine[i] : null,
      histogram: i >= 33 ? macdLine[i] - signalLine[i] : null,
    });
  }

  return points;
}

interface Props {
  ticker: string;
}

export default function TechnicalChart({ ticker }: Props) {
  const [data, setData] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [indicator, setIndicator] = useState<"bollinger" | "rsi" | "macd">(
    "bollinger"
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    async function load() {
      const finnhubKey = getProviderKey("finnhub");
      if (!finnhubKey) {
        setError(true);
        setLoading(false);
        return;
      }
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 180 * 86400;
        const url = `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${finnhubKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (json.s !== "ok" || !json.c) throw new Error();

        const closes: number[] = json.c;
        const dates: string[] = json.t.map((ts: number) =>
          new Date(ts * 1000).toISOString().slice(5, 10)
        );

        if (!cancelled) {
          setData(computeIndicators(closes, dates));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-3">
        <div className="h-40 bg-t-input rounded animate-pulse" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-3">
        <p className="text-[10px] text-t-muted">
          Technical chart requires Finnhub API key.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Technical Analysis
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {(["bollinger", "rsi", "macd"] as const).map((ind) => (
            <button
              key={ind}
              onClick={() => setIndicator(ind)}
              className={`text-[9px] px-2 py-0.5 rounded tracking-wider uppercase ${
                indicator === ind
                  ? "bg-t-accent-bg text-t-accent"
                  : "text-t-muted hover:text-t-text"
              }`}
            >
              {ind === "bollinger" ? "BB" : ind.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {indicator === "bollinger" && (
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={data}>
            <CartesianGrid stroke="#1a1f26" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: "#0b0e11",
                border: "1px solid #1e2530",
                fontSize: 10,
              }}
            />
            <Area
              dataKey="bb_upper"
              stroke="none"
              fill="#f0a03015"
              connectNulls
            />
            <Area
              dataKey="bb_lower"
              stroke="none"
              fill="#0b0e11"
              connectNulls
            />
            <Line
              dataKey="bb_upper"
              stroke="#f0a03060"
              dot={false}
              strokeWidth={1}
              connectNulls
            />
            <Line
              dataKey="bb_lower"
              stroke="#f0a03060"
              dot={false}
              strokeWidth={1}
              connectNulls
            />
            <Line
              dataKey="sma20"
              stroke="#f0a030"
              dot={false}
              strokeWidth={1}
              connectNulls
            />
            <Line
              dataKey="close"
              stroke="#e5e7eb"
              dot={false}
              strokeWidth={1.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {indicator === "rsi" && (
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={data}>
            <CartesianGrid stroke="#1a1f26" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              width={30}
              ticks={[30, 50, 70]}
            />
            <Tooltip
              contentStyle={{
                background: "#0b0e11",
                border: "1px solid #1e2530",
                fontSize: 10,
              }}
            />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
            <Line
              dataKey="rsi"
              stroke="#a855f7"
              dot={false}
              strokeWidth={1.5}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {indicator === "macd" && (
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={data}>
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
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#0b0e11",
                border: "1px solid #1e2530",
                fontSize: 10,
              }}
            />
            <ReferenceLine y={0} stroke="#4b5563" />
            <Line
              dataKey="macd"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={1.5}
              connectNulls
            />
            <Line
              dataKey="signal"
              stroke="#f0a030"
              dot={false}
              strokeWidth={1}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
