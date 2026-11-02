import type { BacktestResult } from "../../types";

interface Props {
  result: BacktestResult;
  initialCapital: number;
}

export default function RiskMetrics({ result, initialCapital }: Props) {
  const values = result.equity_curve.map((e) => e.value);
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }

  if (returns.length < 2) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  const stddev = Math.sqrt(variance);
  const annualizedReturn = mean * 252;
  const annualizedVol = stddev * Math.sqrt(252);
  const sharpe = annualizedVol > 0 ? annualizedReturn / annualizedVol : 0;

  // Sortino (downside deviation)
  const downside = returns.filter((r) => r < 0);
  const downsideVar =
    downside.length > 0
      ? downside.reduce((a, r) => a + r ** 2, 0) / downside.length
      : 0;
  const downsideDev = Math.sqrt(downsideVar) * Math.sqrt(252);
  const sortino = downsideDev > 0 ? annualizedReturn / downsideDev : 0;

  // Beta vs buy & hold
  const bhValues = result.buy_hold_curve.map((e) => e.value);
  const bhReturns: number[] = [];
  for (let i = 1; i < bhValues.length; i++) {
    bhReturns.push((bhValues[i] - bhValues[i - 1]) / bhValues[i - 1]);
  }
  let beta = 1;
  if (bhReturns.length === returns.length && bhReturns.length > 0) {
    const bhMean = bhReturns.reduce((a, b) => a + b, 0) / bhReturns.length;
    let cov = 0,
      bhVar = 0;
    for (let i = 0; i < returns.length; i++) {
      cov += (returns[i] - mean) * (bhReturns[i] - bhMean);
      bhVar += (bhReturns[i] - bhMean) ** 2;
    }
    if (bhVar > 0) beta = cov / bhVar;
  }

  // Max drawdown (already in metrics but recalculate for display)
  const maxDD = result.metrics.max_drawdown_pct / 100;

  // Calmar ratio
  const totalReturn =
    (values[values.length - 1] - initialCapital) / initialCapital;
  const years = returns.length / 252;
  const annReturn = years > 0 ? totalReturn / years : totalReturn;
  const calmar = maxDD > 0 ? annReturn / maxDD : 0;

  // Win rate from trades
  const wins = result.trades.filter((t) => t.pnl > 0).length;
  const total = result.trades.length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  // Profit factor
  const grossProfit = result.trades
    .filter((t) => t.pnl > 0)
    .reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(
    result.trades.filter((t) => t.pnl < 0).reduce((a, t) => a + t.pnl, 0)
  );
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const metrics = [
    { label: "Sharpe Ratio", value: sharpe.toFixed(2), good: sharpe > 1 },
    { label: "Sortino Ratio", value: sortino.toFixed(2), good: sortino > 1.5 },
    { label: "Beta", value: beta.toFixed(2), good: true },
    {
      label: "Ann. Volatility",
      value: `${(annualizedVol * 100).toFixed(1)}%`,
      good: annualizedVol < 0.2,
    },
    {
      label: "Max Drawdown",
      value: `${(maxDD * 100).toFixed(1)}%`,
      good: maxDD < 0.15,
    },
    { label: "Calmar Ratio", value: calmar.toFixed(2), good: calmar > 1 },
    { label: "Win Rate", value: `${winRate.toFixed(0)}%`, good: winRate > 50 },
    {
      label: "Profit Factor",
      value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2),
      good: profitFactor > 1.5,
    },
  ];

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 space-y-2">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Risk Analytics
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-t-bg border border-t-border rounded px-2 py-1.5"
          >
            <p className="text-[9px] text-t-muted">{m.label}</p>
            <p
              className={`text-sm font-bold ${
                m.good ? "text-t-green" : "text-t-red"
              }`}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
