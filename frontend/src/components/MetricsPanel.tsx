interface Metrics {
  total_return_pct: number;
  annualized_return_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  num_trades: number;
  total_pnl: number;
}

interface Props {
  metrics: Metrics;
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-t-panel border border-t-border rounded p-3">
      <p className="text-[10px] text-t-muted tracking-wider uppercase mb-1">
        {label}
      </p>
      <p className={`text-lg font-bold ${color ?? "text-t-text"}`}>{value}</p>
    </div>
  );
}

export default function MetricsPanel({ metrics }: Props) {
  const retColor =
    metrics.total_return_pct >= 0 ? "text-t-green" : "text-t-red";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Total Return"
        value={`${metrics.total_return_pct.toFixed(2)}%`}
        color={retColor}
      />
      <MetricCard
        label="Annualized Return"
        value={`${metrics.annualized_return_pct.toFixed(2)}%`}
        color={retColor}
      />
      <MetricCard
        label="Sharpe Ratio"
        value={metrics.sharpe_ratio.toFixed(2)}
      />
      <MetricCard
        label="Max Drawdown"
        value={`${metrics.max_drawdown_pct.toFixed(2)}%`}
        color="text-t-red"
      />
      <MetricCard
        label="Win Rate"
        value={`${metrics.win_rate_pct.toFixed(1)}%`}
      />
      <MetricCard label="Trades" value={String(metrics.num_trades)} />
      <MetricCard
        label="Total P&L"
        value={`$${metrics.total_pnl.toFixed(2)}`}
        color={metrics.total_pnl >= 0 ? "text-t-green" : "text-t-red"}
      />
    </div>
  );
}
