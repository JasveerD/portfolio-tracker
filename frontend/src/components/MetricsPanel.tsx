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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ?? ""}`}>{value}</p>
    </div>
  );
}

export default function MetricsPanel({ metrics }: Props) {
  const retColor =
    metrics.total_return_pct >= 0 ? "text-green-500" : "text-red-500";

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
        color="text-red-500"
      />
      <MetricCard
        label="Win Rate"
        value={`${metrics.win_rate_pct.toFixed(1)}%`}
      />
      <MetricCard label="Trades" value={String(metrics.num_trades)} />
      <MetricCard
        label="Total P&L"
        value={`$${metrics.total_pnl.toFixed(2)}`}
        color={metrics.total_pnl >= 0 ? "text-green-500" : "text-red-500"}
      />
    </div>
  );
}
