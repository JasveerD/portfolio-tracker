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

interface StrategyInfo {
  summary: string;
  buyRule: string;
  sellRule: string;
  params: { name: string; description: string }[];
  strengths: string;
  weaknesses: string;
}

const STRATEGY_INFO: Record<string, StrategyInfo> = {
  sma_crossover: {
    summary:
      "Tracks two Simple Moving Averages (SMA) of different lengths. When the shorter-term average crosses above the longer-term one, it signals upward momentum and triggers a buy. The reverse crossover signals fading momentum and triggers a sell.",
    buyRule:
      "Buy when the short SMA crosses above the long SMA (golden cross).",
    sellRule:
      "Sell when the short SMA crosses below the long SMA (death cross).",
    params: [
      {
        name: "Short Window",
        description:
          "Number of days for the fast-moving average. Lower values react faster to price changes but produce more noise. Default: 20.",
      },
      {
        name: "Long Window",
        description:
          "Number of days for the slow-moving average. Higher values smooth out noise but lag behind real moves. Default: 50.",
      },
    ],
    strengths:
      "Works well in trending markets with sustained directional moves. Simple to understand and widely used.",
    weaknesses:
      "Generates frequent false signals in sideways or choppy markets. The moving averages lag behind price, so entries and exits are always somewhat late.",
  },
  rsi: {
    summary:
      "The Relative Strength Index measures the speed and magnitude of recent price changes on a 0–100 scale. Extreme low readings suggest the asset is oversold (potentially undervalued), while extreme high readings suggest it is overbought (potentially overvalued).",
    buyRule:
      "Buy when RSI crosses below the oversold threshold (e.g. drops under 30), signaling a potential reversal upward.",
    sellRule:
      "Sell when RSI crosses above the overbought threshold (e.g. rises above 70), signaling a potential reversal downward.",
    params: [
      {
        name: "Period",
        description:
          "Lookback window for the RSI calculation. Shorter periods make the indicator more sensitive. Default: 14.",
      },
      {
        name: "Oversold",
        description:
          "RSI level below which the asset is considered oversold. Lower values produce fewer but more extreme signals. Default: 30.",
      },
      {
        name: "Overbought",
        description:
          "RSI level above which the asset is considered overbought. Higher values produce fewer but more extreme signals. Default: 70.",
      },
    ],
    strengths:
      "Good at catching reversals in range-bound markets. The thresholds are intuitive and easy to tune.",
    weaknesses:
      "In strong trends, RSI can stay overbought or oversold for extended periods, causing premature exits or missed rallies.",
  },
  bollinger_bands: {
    summary:
      "Bollinger Bands place an upper and lower band around a moving average, each offset by a multiple of the rolling standard deviation. Prices touching or breaking through a band suggest the asset has moved unusually far from its recent average.",
    buyRule:
      "Buy when the price crosses below the lower band, suggesting the asset is statistically cheap relative to recent history.",
    sellRule:
      "Sell when the price crosses above the upper band, suggesting the asset is statistically expensive relative to recent history.",
    params: [
      {
        name: "Period",
        description:
          "Lookback window for the moving average and standard deviation. Default: 20.",
      },
      {
        name: "Std Dev",
        description:
          "Number of standard deviations for the band width. Higher values widen the bands and produce fewer signals. Default: 2.",
      },
    ],
    strengths:
      "Adapts to volatility automatically — bands widen in volatile markets and tighten in calm ones. Effective for mean-reversion plays.",
    weaknesses:
      "In trending markets, price can ride along a band for long periods, generating losing trades. Assumes prices revert to the mean, which isn't always true.",
  },
  macd: {
    summary:
      "MACD (Moving Average Convergence Divergence) measures the difference between a fast and slow exponential moving average (EMA). A signal line — an EMA of the MACD line itself — is used to detect shifts in momentum. Crossovers between these two lines generate trade signals.",
    buyRule:
      "Buy when the MACD line crosses above the signal line (bullish crossover), indicating accelerating upward momentum.",
    sellRule:
      "Sell when the MACD line crosses below the signal line (bearish crossover), indicating accelerating downward momentum.",
    params: [
      {
        name: "Fast Period",
        description:
          "Days for the fast EMA. Reacts quickly to price changes. Default: 12.",
      },
      {
        name: "Slow Period",
        description:
          "Days for the slow EMA. Captures the broader trend. Default: 26.",
      },
      {
        name: "Signal Period",
        description:
          "Days for the signal line EMA (smoothed MACD). Lower values react faster to MACD changes. Default: 9.",
      },
    ],
    strengths:
      "Combines trend and momentum information in one indicator. More responsive than SMA crossovers due to exponential weighting.",
    weaknesses:
      "Still a lagging indicator — signals arrive after the move has started. Prone to whipsaws in trendless markets, similar to SMA crossover.",
  },
  buy_and_hold: {
    summary:
      "The simplest possible strategy: buy at the start of the period and hold until the end. No active trading decisions are made. Serves as the baseline benchmark that every other strategy should be compared against.",
    buyRule: "Buy the full position on the first trading day of the period.",
    sellRule:
      "No sell signal — the position is held through the entire backtest window.",
    params: [],
    strengths:
      "Zero transaction costs, no whipsaw losses, and captures the full market return. Historically hard to beat over long horizons.",
    weaknesses:
      "Fully exposed to drawdowns with no risk management. Offers no downside protection during bear markets.",
  },
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
  const [showInfo, setShowInfo] = useState(false);

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

  const info = STRATEGY_INFO[strategy];

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
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="mt-1.5 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {showInfo ? "Hide details" : "How it works"}
          </button>
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

      {showInfo && info && (
        <div className="rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3 text-sm">
          <p className="text-gray-700 dark:text-gray-300">{info.summary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex gap-2">
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                B
              </span>
              <p className="text-gray-600 dark:text-gray-400">{info.buyRule}</p>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">
                S
              </span>
              <p className="text-gray-600 dark:text-gray-400">
                {info.sellRule}
              </p>
            </div>
          </div>

          {info.params.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Parameters
              </p>
              <div className="space-y-1.5">
                {info.params.map((p) => (
                  <p key={p.name} className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {p.name}
                    </span>{" "}
                    — {p.description}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t dark:border-gray-700">
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">
                Works well when
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {info.strengths}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-0.5">
                Watch out for
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {info.weaknesses}
              </p>
            </div>
          </div>
        </div>
      )}

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
