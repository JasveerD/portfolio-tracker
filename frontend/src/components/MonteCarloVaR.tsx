import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Props {
  equityCurve: { date: string; value: number }[];
  initialCapital: number;
}

function computeReturns(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  return returns;
}

function runSimulation(
  returns: number[],
  initial: number,
  days: number,
  numSims: number
): number[][] {
  const paths: number[][] = [];
  for (let s = 0; s < numSims; s++) {
    const path = [initial];
    for (let d = 1; d <= days; d++) {
      const r = returns[Math.floor(Math.random() * returns.length)];
      path.push(path[d - 1] * (1 + r));
    }
    paths.push(path);
  }
  return paths;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export default function MonteCarloVaR({ equityCurve, initialCapital }: Props) {
  const [horizon, setHorizon] = useState<number>(252);
  const NUM_SIMS = 1000;

  const values = useMemo(
    () => equityCurve.map((e) => e.value),
    [equityCurve]
  );
  const returns = useMemo(() => computeReturns(values), [values]);

  const { chartData, varMetrics } = useMemo(() => {
    if (returns.length < 10) {
      return { chartData: [], finalValues: [], varMetrics: null };
    }

    const paths = runSimulation(returns, initialCapital, horizon, NUM_SIMS);

    const finals = paths.map((p) => p[p.length - 1]);

    const p10: number[] = [];
    const p25: number[] = [];
    const p50: number[] = [];
    const p75: number[] = [];
    const p90: number[] = [];

    for (let d = 0; d <= horizon; d++) {
      const vals = paths.map((p) => p[d]);
      p10.push(percentile(vals, 10));
      p25.push(percentile(vals, 25));
      p50.push(percentile(vals, 50));
      p75.push(percentile(vals, 75));
      p90.push(percentile(vals, 90));
    }

    const chart = [];
    const step = Math.max(1, Math.floor(horizon / 60));
    for (let d = 0; d <= horizon; d += step) {
      chart.push({
        day: d,
        p10: Math.round(p10[d]),
        p25: Math.round(p25[d]),
        p50: Math.round(p50[d]),
        p75: Math.round(p75[d]),
        p90: Math.round(p90[d]),
      });
    }

    const dailyReturns = finals.map(
      (f) => (f - initialCapital) / initialCapital
    );

    return {
      chartData: chart,
      varMetrics: {
        var95: percentile(dailyReturns, 5) * 100,
        var99: percentile(dailyReturns, 1) * 100,
        cvar95:
          (dailyReturns
            .filter((r) => r <= percentile(dailyReturns, 5))
            .reduce((a, b) => a + b, 0) /
            Math.max(
              1,
              dailyReturns.filter((r) => r <= percentile(dailyReturns, 5))
                .length
            )) *
          100,
        median: percentile(dailyReturns, 50) * 100,
        best: Math.max(...dailyReturns) * 100,
        worst: Math.min(...dailyReturns) * 100,
        probLoss: (finals.filter((f) => f < initialCapital).length / NUM_SIMS) * 100,
      },
    };
  }, [returns, initialCapital, horizon]);

  if (returns.length < 10) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-4">
        <p className="text-[10px] text-t-muted">
          Not enough data for Monte Carlo simulation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Monte Carlo Simulation ({NUM_SIMS.toLocaleString()} paths)
        </h3>
        <div className="flex items-center gap-1">
          {[63, 126, 252].map((d) => (
            <button
              key={d}
              onClick={() => setHorizon(d)}
              className={`text-[9px] px-2 py-0.5 rounded tracking-wider ${
                horizon === d
                  ? "bg-t-accent-bg text-t-accent"
                  : "text-t-muted hover:text-t-text"
              }`}
            >
              {d === 63 ? "3M" : d === 126 ? "6M" : "1Y"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData}>
          <CartesianGrid stroke="#1a1f26" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            label={{
              value: "Days",
              position: "insideBottomRight",
              fontSize: 9,
              fill: "#6b7280",
              offset: -5,
            }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            width={55}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#0b0e11",
              border: "1px solid #1e2530",
              fontSize: 10,
            }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
          />
          <ReferenceLine
            y={initialCapital}
            stroke="#6b7280"
            strokeDasharray="3 3"
          />
          <Area
            dataKey="p90"
            stroke="none"
            fill="#22c55e15"
            fillOpacity={1}
          />
          <Area
            dataKey="p75"
            stroke="none"
            fill="#22c55e25"
            fillOpacity={1}
          />
          <Area
            dataKey="p50"
            stroke="#f0a030"
            fill="#f0a03015"
            strokeWidth={1.5}
            fillOpacity={1}
          />
          <Area
            dataKey="p25"
            stroke="none"
            fill="#0b0e11"
            fillOpacity={1}
          />
          <Area
            dataKey="p10"
            stroke="none"
            fill="#0b0e11"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-2 text-[8px] text-t-muted justify-center">
        <span>
          <span className="inline-block w-3 h-1.5 bg-green-500/20 mr-1" />
          P90
        </span>
        <span>
          <span className="inline-block w-3 h-1.5 bg-green-500/40 mr-1" />
          P75
        </span>
        <span className="text-t-accent">— Median</span>
        <span>P25</span>
        <span>P10</span>
      </div>

      {varMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
            <p className="text-[9px] text-t-muted">VaR (95%)</p>
            <p className="text-xs font-bold text-t-red">
              {varMetrics.var95.toFixed(1)}%
            </p>
          </div>
          <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
            <p className="text-[9px] text-t-muted">CVaR (95%)</p>
            <p className="text-xs font-bold text-t-red">
              {varMetrics.cvar95.toFixed(1)}%
            </p>
          </div>
          <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
            <p className="text-[9px] text-t-muted">Prob of Loss</p>
            <p className="text-xs font-bold">
              {varMetrics.probLoss.toFixed(0)}%
            </p>
          </div>
          <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
            <p className="text-[9px] text-t-muted">Median Return</p>
            <p
              className={`text-xs font-bold ${
                varMetrics.median >= 0 ? "text-t-green" : "text-t-red"
              }`}
            >
              {varMetrics.median >= 0 ? "+" : ""}
              {varMetrics.median.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
