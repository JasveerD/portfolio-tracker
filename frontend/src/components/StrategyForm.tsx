import { useState } from "react";
import type { BacktestRequest } from "../types";

const STRATEGIES = [
  { value: "sma_crossover", label: "SMA Crossover" },
  { value: "rsi", label: "RSI" },
  { value: "bollinger_bands", label: "Bollinger Bands" },
  { value: "macd", label: "MACD" },
  { value: "buy_and_hold", label: "Buy & Hold" },
];

const DEFAULT_PARAMS: Record<string, Record<string, number>> = {
  sma_crossover: { short_window: 20, long_window: 50 },
  rsi: { period: 14, oversold: 30, overbought: 70 },
  bollinger_bands: { period: 20, std_dev: 2 },
  macd: { fast_period: 12, slow_period: 26, signal_period: 9 },
  buy_and_hold: {},
};

const PARAM_LABELS: Record<string, string> = {
  short_window: "Short Window",
  long_window: "Long Window",
  period: "Period",
  oversold: "Oversold",
  overbought: "Overbought",
  std_dev: "Std Dev",
  fast_period: "Fast Period",
  slow_period: "Slow Period",
  signal_period: "Signal Period",
};

interface Props {
  onSubmit: (req: BacktestRequest) => void;
  loading: boolean;
}

export default function StrategyForm({ onSubmit, loading }: Props) {
  const [ticker, setTicker] = useState("AAPL");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [capital, setCapital] = useState(10000);
  const [params, setParams] = useState<Record<string, number>>(
    DEFAULT_PARAMS["sma_crossover"]
  );

  const handleStrategyChange = (s: string) => {
    setStrategy(s);
    setParams({ ...DEFAULT_PARAMS[s] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ticker: ticker.toUpperCase(),
      strategy,
      start_date: startDate,
      end_date: endDate,
      initial_capital: capital,
      params,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-4"
    >
      <h3 className="text-lg font-bold">Backtest Configuration</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
            Ticker
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
            Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
            Initial Capital
          </label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {Object.keys(params).length > 0 && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Strategy Parameters
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(params).map(([key, val]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">
                  {PARAM_LABELS[key] || key}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) =>
                    setParams({ ...params, [key]: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
      >
        {loading ? "Running..." : "Run Backtest"}
      </button>
    </form>
  );
}
