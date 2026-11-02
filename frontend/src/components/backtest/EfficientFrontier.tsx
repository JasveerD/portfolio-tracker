import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

interface Props {
  equityCurve: { date: string; value: number }[];
  buyHoldCurve: { date: string; value: number }[];
  initialCapital: number;
}

function computeStats(values: number[]) {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  if (returns.length === 0) return { ret: 0, vol: 0 };
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  return {
    ret: mean * 252 * 100,
    vol: Math.sqrt(variance) * Math.sqrt(252) * 100,
  };
}

export default function EfficientFrontier({
  equityCurve,
  buyHoldCurve,
  initialCapital,
}: Props) {
  const { strategyPoint, buyHoldPoint, frontierPoints } = useMemo(() => {
    const stratVals = equityCurve.map((e) => e.value);
    const bhVals = buyHoldCurve.map((e) => e.value);

    const strat = computeStats(stratVals);
    const bh = computeStats(bhVals);

    // Generate random portfolio combinations between strategy & buy-hold
    const points: { vol: number; ret: number }[] = [];
    for (let i = 0; i < 200; i++) {
      const w = Math.random();
      const combined: number[] = [];
      const len = Math.min(stratVals.length, bhVals.length);
      for (let j = 0; j < len; j++) {
        combined.push(
          w * stratVals[j] + (1 - w) * bhVals[j]
        );
      }
      const s = computeStats(combined);
      points.push({
        vol: Math.round(s.vol * 10) / 10,
        ret: Math.round(s.ret * 10) / 10,
      });
    }

    // Add pure cash (0 vol, ~0 return)
    for (let w = 0; w <= 1; w += 0.05) {
      const cashWeight = w;
      const stratWeight = 1 - w;
      const combined: number[] = [];
      for (let j = 0; j < stratVals.length; j++) {
        combined.push(
          stratWeight * stratVals[j] +
            cashWeight * initialCapital
        );
      }
      const s = computeStats(combined);
      points.push({
        vol: Math.round(s.vol * 10) / 10,
        ret: Math.round(s.ret * 10) / 10,
      });
    }

    return {
      strategyPoint: {
        vol: Math.round(strat.vol * 10) / 10,
        ret: Math.round(strat.ret * 10) / 10,
      },
      buyHoldPoint: {
        vol: Math.round(bh.vol * 10) / 10,
        ret: Math.round(bh.ret * 10) / 10,
      },
      frontierPoints: points,
    };
  }, [equityCurve, buyHoldCurve, initialCapital]);

  const stratSharpe =
    strategyPoint.vol > 0
      ? (strategyPoint.ret / strategyPoint.vol).toFixed(2)
      : "--";
  const bhSharpe =
    buyHoldPoint.vol > 0
      ? (buyHoldPoint.ret / buyHoldPoint.vol).toFixed(2)
      : "--";

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 space-y-3">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Risk-Return Frontier
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <ScatterChart>
          <CartesianGrid stroke="#1a1f26" />
          <XAxis
            dataKey="vol"
            name="Volatility"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            label={{
              value: "Annualized Vol %",
              position: "insideBottomRight",
              fontSize: 9,
              fill: "#6b7280",
              offset: -5,
            }}
          />
          <YAxis
            dataKey="ret"
            name="Return"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            width={40}
            label={{
              value: "Ann. Return %",
              angle: -90,
              position: "insideLeft",
              fontSize: 9,
              fill: "#6b7280",
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#0b0e11",
              border: "1px solid #1e2530",
              fontSize: 10,
            }}
            formatter={(v: number, name: string) => [
              `${v.toFixed(1)}%`,
              name,
            ]}
          />
          <Scatter
            data={frontierPoints}
            fill="#f0a03030"
            shape="circle"
          />
          <ReferenceDot
            x={strategyPoint.vol}
            y={strategyPoint.ret}
            r={6}
            fill="#f0a030"
            stroke="#f0a030"
          />
          <ReferenceDot
            x={buyHoldPoint.vol}
            y={buyHoldPoint.ret}
            r={6}
            fill="#6b7280"
            stroke="#6b7280"
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 text-[9px]">
        <span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-t-accent mr-1" />
          Strategy (Sharpe {stratSharpe})
        </span>
        <span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-500 mr-1" />
          Buy & Hold (Sharpe {bhSharpe})
        </span>
      </div>
    </div>
  );
}
