import { useState } from "react";
import type { BacktestRequest } from "../../types";

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
    buyRule: "Buy when the short SMA crosses above the long SMA (golden cross).",
    sellRule: "Sell when the short SMA crosses below the long SMA (death cross).",
    params: [
      { name: "Short Window", description: "Days for the fast-moving average. Lower = faster reaction. Default: 20." },
      { name: "Long Window", description: "Days for the slow-moving average. Higher = smoother. Default: 50." },
    ],
    strengths: "Works well in trending markets with sustained directional moves.",
    weaknesses: "Frequent false signals in sideways or choppy markets.",
  },
  rsi: {
    summary:
      "The Relative Strength Index measures the speed and magnitude of recent price changes on a 0-100 scale. Extreme low readings suggest oversold, extreme high suggest overbought.",
    buyRule: "Buy when RSI drops below the oversold threshold (e.g. under 30).",
    sellRule: "Sell when RSI rises above the overbought threshold (e.g. above 70).",
    params: [
      { name: "Period", description: "Lookback window. Shorter = more sensitive. Default: 14." },
      { name: "Oversold", description: "RSI level for buy signals. Default: 30." },
      { name: "Overbought", description: "RSI level for sell signals. Default: 70." },
    ],
    strengths: "Good at catching reversals in range-bound markets.",
    weaknesses: "In strong trends, RSI can stay overbought/oversold for extended periods.",
  },
  bollinger_bands: {
    summary:
      "Bollinger Bands place an upper and lower band around a moving average, each offset by a multiple of the rolling standard deviation.",
    buyRule: "Buy when price crosses below the lower band.",
    sellRule: "Sell when price crosses above the upper band.",
    params: [
      { name: "Period", description: "Lookback window for MA and std dev. Default: 20." },
      { name: "Std Dev", description: "Band width multiplier. Higher = fewer signals. Default: 2." },
    ],
    strengths: "Adapts to volatility automatically. Effective for mean-reversion.",
    weaknesses: "In trending markets, price can ride along a band generating losing trades.",
  },
  macd: {
    summary:
      "MACD measures the difference between a fast and slow EMA. A signal line (EMA of MACD) detects momentum shifts.",
    buyRule: "Buy when MACD crosses above the signal line (bullish crossover).",
    sellRule: "Sell when MACD crosses below the signal line (bearish crossover).",
    params: [
      { name: "Fast Period", description: "Days for fast EMA. Default: 12." },
      { name: "Slow Period", description: "Days for slow EMA. Default: 26." },
      { name: "Signal Period", description: "Days for signal line EMA. Default: 9." },
    ],
    strengths: "Combines trend and momentum. More responsive than SMA crossovers.",
    weaknesses: "Still lagging. Prone to whipsaws in trendless markets.",
  },
  buy_and_hold: {
    summary:
      "Buy at the start, hold until the end. No active trading. The baseline benchmark every strategy should beat.",
    buyRule: "Buy on the first trading day.",
    sellRule: "No sell signal — hold through entire period.",
    params: [],
    strengths: "Zero transaction costs, captures full market return.",
    weaknesses: "Fully exposed to drawdowns with no downside protection.",
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
  const inputClass =
    "w-full px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-t-panel border border-t-border rounded p-4 space-y-4"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Ticker
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
            className={inputClass}
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
            className="mt-1 text-[10px] text-t-accent hover:text-t-text flex items-center gap-1 tracking-wide"
          >
            {showInfo ? "HIDE" : "INFO"}
          </button>
        </div>

        <div>
          <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Capital
          </label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Start
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
            End
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {showInfo && info && (
        <div className="border border-t-border rounded p-3 space-y-2 text-xs bg-t-bg">
          <p className="text-t-text">{info.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex gap-2">
              <span className="shrink-0 w-4 h-4 rounded-sm bg-t-green-bg text-t-green flex items-center justify-center text-[10px] font-bold">
                B
              </span>
              <p className="text-t-muted">{info.buyRule}</p>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0 w-4 h-4 rounded-sm bg-t-red-bg text-t-red flex items-center justify-center text-[10px] font-bold">
                S
              </span>
              <p className="text-t-muted">{info.sellRule}</p>
            </div>
          </div>
          {info.params.length > 0 && (
            <div className="space-y-1">
              {info.params.map((p) => (
                <p key={p.name} className="text-t-muted">
                  <span className="text-t-accent">{p.name}</span> — {p.description}
                </p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-t-border">
            <p className="text-t-muted">
              <span className="text-t-green text-[10px] tracking-wider">STRENGTH </span>
              {info.strengths}
            </p>
            <p className="text-t-muted">
              <span className="text-t-red text-[10px] tracking-wider">WEAKNESS </span>
              {info.weaknesses}
            </p>
          </div>
        </div>
      )}

      {Object.keys(params).length > 0 && (
        <div>
          <p className="text-[10px] text-t-muted tracking-wider uppercase mb-2">
            Parameters
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(params).map(([key, val]) => (
              <div key={key}>
                <label className="block text-[10px] text-t-muted mb-1">
                  {PARAM_LABELS[key] || key}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) =>
                    setParams({ ...params, [key]: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-1.5 text-xs font-medium bg-t-accent text-t-bg rounded hover:brightness-110 disabled:opacity-50 tracking-wide"
      >
        {loading ? "RUNNING..." : "RUN BACKTEST"}
      </button>
    </form>
  );
}
