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
import { getProviderKey, getWatchlist } from "../services/marketOverview";

const FINNHUB = "https://finnhub.io/api/v1";

interface PairResult {
  ticker1: string;
  ticker2: string;
  correlation: number;
  currentZScore: number;
  spread: { date: string; zscore: number }[];
}

async function fetchCloses(
  ticker: string,
  key: string
): Promise<{ dates: number[]; closes: number[] }> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 180 * 86400;
  const url = `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { dates: [], closes: [] };
  const data = await res.json();
  if (data.s !== "ok" || !data.c) return { dates: [], closes: [] };
  return { dates: data.t, closes: data.c };
}

function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 10) return 0;
  let sumA = 0,
    sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let cov = 0,
    varA = 0,
    varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - meanA) * (b[i] - meanB);
    varA += (a[i] - meanA) ** 2;
    varB += (b[i] - meanB) ** 2;
  }

  const denom = Math.sqrt(varA * varB);
  return denom > 0 ? cov / denom : 0;
}

function computeZScore(
  a: number[],
  b: number[],
  dates: number[]
): { zscore: number[]; spreadDates: string[] } {
  const n = Math.min(a.length, b.length);
  const spread: number[] = [];
  const spreadDates: string[] = [];
  for (let i = 0; i < n; i++) {
    spread.push(Math.log(a[i]) - Math.log(b[i]));
    spreadDates.push(new Date(dates[i] * 1000).toISOString().slice(5, 10));
  }

  const mean = spread.reduce((s, v) => s + v, 0) / n;
  const std = Math.sqrt(
    spread.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  );

  const zscore = spread.map((s) => (std > 0 ? (s - mean) / std : 0));
  return { zscore, spreadDates };
}

export default function PairsTrading() {
  const [pairs, setPairs] = useState<PairResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function scan() {
      const key = getProviderKey("finnhub");
      if (!key) {
        setLoading(false);
        return;
      }

      const watchlist = getWatchlist();
      const tickers =
        watchlist.length >= 2
          ? watchlist.slice(0, 8)
          : ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META"];

      const dataMap = new Map<
        string,
        { dates: number[]; closes: number[] }
      >();

      for (const t of tickers) {
        const d = await fetchCloses(t, key);
        if (d.closes.length > 20) dataMap.set(t, d);
      }

      if (cancelled) return;

      const results: PairResult[] = [];
      const keys = [...dataMap.keys()];

      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const d1 = dataMap.get(keys[i])!;
          const d2 = dataMap.get(keys[j])!;
          const n = Math.min(d1.closes.length, d2.closes.length);
          const c1 = d1.closes.slice(-n);
          const c2 = d2.closes.slice(-n);
          const dates = d1.dates.slice(-n);

          const corr = correlation(c1, c2);
          if (Math.abs(corr) < 0.5) continue;

          const { zscore, spreadDates } = computeZScore(c1, c2, dates);

          const step = Math.max(1, Math.floor(zscore.length / 60));
          const spreadPoints: { date: string; zscore: number }[] = [];
          for (let k = 0; k < zscore.length; k += step) {
            spreadPoints.push({
              date: spreadDates[k],
              zscore: Math.round(zscore[k] * 100) / 100,
            });
          }

          results.push({
            ticker1: keys[i],
            ticker2: keys[j],
            correlation: Math.round(corr * 1000) / 1000,
            currentZScore:
              Math.round(zscore[zscore.length - 1] * 100) / 100,
            spread: spreadPoints,
          });
        }
      }

      results.sort(
        (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
      );

      if (!cancelled) {
        setPairs(results.slice(0, 6));
        setLoading(false);
      }
    }

    scan();
    return () => {
      cancelled = true;
    };
  }, []);

  const key = getProviderKey("finnhub");
  if (!key) return null;

  if (loading) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-4">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-2">
          Pairs Trading Scanner
        </h3>
        <div className="h-32 bg-t-input rounded animate-pulse" />
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-4">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-2">
          Pairs Trading Scanner
        </h3>
        <p className="text-[10px] text-t-muted">
          No correlated pairs found. Add more stocks to your watchlist.
        </p>
      </div>
    );
  }

  const pair = pairs[selectedPair];

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 space-y-3">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Pairs Trading Scanner
      </h3>

      <div className="flex flex-wrap gap-1">
        {pairs.map((p, i) => (
          <button
            key={`${p.ticker1}-${p.ticker2}`}
            onClick={() => setSelectedPair(i)}
            className={`text-[9px] px-2 py-1 rounded border transition-colors ${
              selectedPair === i
                ? "border-t-accent bg-t-accent-bg text-t-accent"
                : "border-t-border text-t-muted hover:text-t-text"
            }`}
          >
            {p.ticker1}/{p.ticker2}
          </button>
        ))}
      </div>

      {pair && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
              <p className="text-[9px] text-t-muted">Correlation</p>
              <p
                className={`text-sm font-bold ${
                  pair.correlation > 0.8
                    ? "text-t-green"
                    : pair.correlation > 0.6
                    ? "text-t-accent"
                    : "text-t-text"
                }`}
              >
                {pair.correlation.toFixed(3)}
              </p>
            </div>
            <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
              <p className="text-[9px] text-t-muted">Z-Score</p>
              <p
                className={`text-sm font-bold ${
                  Math.abs(pair.currentZScore) > 2
                    ? "text-t-red"
                    : Math.abs(pair.currentZScore) > 1
                    ? "text-t-accent"
                    : "text-t-green"
                }`}
              >
                {pair.currentZScore.toFixed(2)}
              </p>
            </div>
            <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
              <p className="text-[9px] text-t-muted">Signal</p>
              <p
                className={`text-[10px] font-bold ${
                  Math.abs(pair.currentZScore) > 2
                    ? "text-t-red"
                    : "text-t-muted"
                }`}
              >
                {pair.currentZScore > 2
                  ? `SHORT ${pair.ticker1} / LONG ${pair.ticker2}`
                  : pair.currentZScore < -2
                  ? `LONG ${pair.ticker1} / SHORT ${pair.ticker2}`
                  : "NO SIGNAL"}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={pair.spread}>
              <CartesianGrid stroke="#1a1f26" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                interval={Math.floor(pair.spread.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                width={25}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b0e11",
                  border: "1px solid #1e2530",
                  fontSize: 10,
                }}
              />
              <ReferenceLine y={0} stroke="#4b5563" />
              <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={1} stroke="#f0a030" strokeDasharray="2 2" />
              <ReferenceLine y={-1} stroke="#f0a030" strokeDasharray="2 2" />
              <Line
                dataKey="zscore"
                stroke="#a855f7"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-[8px] text-t-muted text-center">
            Z-Score of log spread | Red lines = +/- 2σ (trade signal) | Amber
            = +/- 1σ
          </p>
        </div>
      )}
    </div>
  );
}
