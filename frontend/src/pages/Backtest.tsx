import { useState } from "react";
import { api } from "../api/client";
import DrawdownChart from "../components/DrawdownChart";
import EquityCurve from "../components/EquityCurve";
import MetricsPanel from "../components/MetricsPanel";
import StrategyForm from "../components/StrategyForm";
import TradeLog from "../components/TradeLog";
import type { BacktestRequest, BacktestResult } from "../types";

export default function Backtest() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (req: BacktestRequest) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.runBacktest(req);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backtest failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Strategy Backtester</h2>
      <StrategyForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <MetricsPanel metrics={result.metrics} />
          <EquityCurve
            equity={result.equity_curve}
            buyHold={result.buy_hold_curve}
          />
          <DrawdownChart data={result.drawdown_curve} />
          <TradeLog trades={result.trades} />
        </div>
      )}
    </div>
  );
}
