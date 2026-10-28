import type { BacktestResult, Trade } from "../types";

interface PriceRow {
  date: string;
  close: number;
}

export function runBacktest(
  prices: PriceRow[],
  strategy: string,
  initialCapital: number,
  params: Record<string, number>
): BacktestResult {
  const sorted = [...prices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (sorted.length < 2) throw new Error("Not enough price data");

  const close = sorted.map((p) => p.close);
  const dates = sorted.map((p) => p.date);

  const signals = generateSignals(close, strategy, params);
  const { equity, trades } = simulate(dates, close, signals, initialCapital);
  const buyHoldCurve = buyAndHold(dates, close, initialCapital);
  const drawdownCurve = computeDrawdownSeries(equity);
  const metrics = computeMetrics(equity, trades);

  return {
    equity_curve: equity.map((e) => ({
      date: e.date,
      value: round(e.value),
    })),
    buy_hold_curve: buyHoldCurve.map((b) => ({
      date: b.date,
      value: round(b.value),
    })),
    drawdown_curve: drawdownCurve.map((d) => ({
      date: d.date,
      value: round(d.value, 4),
    })),
    trades,
    metrics,
  };
}

function generateSignals(
  close: number[],
  strategy: string,
  params: Record<string, number>
): number[] {
  const n = close.length;
  const signals = new Array<number>(n).fill(0);

  if (strategy === "sma_crossover") {
    const shortW = params.short_window ?? 20;
    const longW = params.long_window ?? 50;
    const shortSma = sma(close, shortW);
    const longSma = sma(close, longW);
    for (let i = 1; i < n; i++) {
      if (shortSma[i] > longSma[i] && shortSma[i - 1] <= longSma[i - 1])
        signals[i] = 1;
      else if (shortSma[i] < longSma[i] && shortSma[i - 1] >= longSma[i - 1])
        signals[i] = -1;
    }
  } else if (strategy === "rsi") {
    const period = params.period ?? 14;
    const oversold = params.oversold ?? 30;
    const overbought = params.overbought ?? 70;
    const rsiVals = rsi(close, period);
    for (let i = 1; i < n; i++) {
      if (rsiVals[i] < oversold && rsiVals[i - 1] >= oversold) signals[i] = 1;
      else if (rsiVals[i] > overbought && rsiVals[i - 1] <= overbought)
        signals[i] = -1;
    }
  } else if (strategy === "bollinger_bands") {
    const period = params.period ?? 20;
    const stdMult = params.std_dev ?? 2;
    const smaVals = sma(close, period);
    const stdVals = rollingStd(close, period);
    for (let i = 1; i < n; i++) {
      const lower = smaVals[i] - stdMult * stdVals[i];
      const upper = smaVals[i] + stdMult * stdVals[i];
      const prevLower = smaVals[i - 1] - stdMult * stdVals[i - 1];
      const prevUpper = smaVals[i - 1] + stdMult * stdVals[i - 1];
      if (close[i] <= lower && close[i - 1] > prevLower) signals[i] = 1;
      else if (close[i] >= upper && close[i - 1] < prevUpper) signals[i] = -1;
    }
  } else if (strategy === "macd") {
    const fast = params.fast_period ?? 12;
    const slow = params.slow_period ?? 26;
    const signalPeriod = params.signal_period ?? 9;
    const emaFast = ema(close, fast);
    const emaSlow = ema(close, slow);
    const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
    const signalLine = ema(macdLine, signalPeriod);
    for (let i = 1; i < n; i++) {
      if (macdLine[i] > signalLine[i] && macdLine[i - 1] <= signalLine[i - 1])
        signals[i] = 1;
      else if (
        macdLine[i] < signalLine[i] &&
        macdLine[i - 1] >= signalLine[i - 1]
      )
        signals[i] = -1;
    }
  } else if (strategy === "buy_and_hold") {
    signals[0] = 1;
  } else {
    throw new Error(`Unknown strategy: ${strategy}`);
  }

  return signals;
}

function simulate(
  dates: string[],
  close: number[],
  signals: number[],
  initialCapital: number
): { equity: { date: string; value: number }[]; trades: Trade[] } {
  let cash = initialCapital;
  let shares = 0;
  let entryPrice = 0;
  let entryDate = "";
  const trades: Trade[] = [];
  const equity: { date: string; value: number }[] = [];

  for (let i = 0; i < close.length; i++) {
    if (signals[i] === 1 && shares === 0) {
      shares = cash / close[i];
      entryPrice = close[i];
      entryDate = dates[i];
      cash = 0;
    } else if (signals[i] === -1 && shares > 0) {
      cash = shares * close[i];
      const pnl = (close[i] - entryPrice) * shares;
      const pnlPct = (close[i] / entryPrice - 1) * 100;
      const holdingDays = Math.round(
        (new Date(dates[i]).getTime() - new Date(entryDate).getTime()) /
          86400000
      );
      trades.push({
        entry_date: entryDate,
        exit_date: dates[i],
        entry_price: round(entryPrice),
        exit_price: round(close[i]),
        pnl: round(pnl),
        pnl_pct: round(pnlPct),
        holding_days: holdingDays,
      });
      shares = 0;
      entryPrice = 0;
      entryDate = "";
    }
    equity.push({ date: dates[i], value: cash + shares * close[i] });
  }

  return { equity, trades };
}

function buyAndHold(
  dates: string[],
  close: number[],
  initialCapital: number
): { date: string; value: number }[] {
  const shares = initialCapital / close[0];
  return dates.map((d, i) => ({ date: d, value: shares * close[i] }));
}

function computeDrawdownSeries(
  equity: { date: string; value: number }[]
): { date: string; value: number }[] {
  let peak = -Infinity;
  return equity.map((e) => {
    peak = Math.max(peak, e.value);
    return { date: e.date, value: (e.value - peak) / peak };
  });
}

function computeMetrics(
  equity: { date: string; value: number }[],
  trades: Trade[]
): BacktestResult["metrics"] {
  const values = equity.map((e) => e.value);
  const initial = values[0];
  const final = values[values.length - 1];

  const totalReturn = (final / initial - 1) * 100;
  const totalDays =
    (new Date(equity[equity.length - 1].date).getTime() -
      new Date(equity[0].date).getTime()) /
    86400000;
  const years = Math.max(totalDays / 365.25, 0.01);
  const annualizedReturn =
    (Math.pow(final / initial, 1 / years) - 1) * 100;

  const dailyReturns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    dailyReturns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const std = Math.sqrt(
    dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) /
      dailyReturns.length
  );
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const v of values) {
    peak = Math.max(peak, v);
    maxDrawdown = Math.min(maxDrawdown, (v - peak) / peak);
  }

  const numTrades = trades.length;
  const winning = trades.filter((t) => t.pnl > 0).length;
  const winRate = numTrades > 0 ? (winning / numTrades) * 100 : 0;

  return {
    total_return_pct: round(totalReturn),
    annualized_return_pct: round(annualizedReturn),
    sharpe_ratio: round(sharpe),
    max_drawdown_pct: round(maxDrawdown * 100),
    win_rate_pct: round(winRate),
    num_trades: numTrades,
    total_pnl: round(trades.reduce((a, t) => a + t.pnl, 0)),
  };
}

function sma(data: number[], window: number): number[] {
  const result = new Array<number>(data.length).fill(NaN);
  for (let i = window - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += data[j];
    result[i] = sum / window;
  }
  return result;
}

function ema(data: number[], window: number): number[] {
  const result = new Array<number>(data.length).fill(NaN);
  result[0] = data[0];
  const mult = 2 / (window + 1);
  for (let i = 1; i < data.length; i++) {
    result[i] = data[i] * mult + result[i - 1] * (1 - mult);
  }
  return result;
}

function rsi(data: number[], period: number): number[] {
  const result = new Array<number>(data.length).fill(50);
  for (let i = period; i < data.length; i++) {
    let gainSum = 0,
      gainCount = 0,
      lossSum = 0,
      lossCount = 0;
    for (let j = Math.max(0, i - period); j < i; j++) {
      const delta = data[j + 1] - data[j];
      if (delta > 0) {
        gainSum += delta;
        gainCount++;
      } else if (delta < 0) {
        lossSum -= delta;
        lossCount++;
      }
    }
    const avgGain = gainCount > 0 ? gainSum / period : 0;
    const avgLoss = lossCount > 0 ? lossSum / period : 0;
    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }
  return result;
}

function rollingStd(data: number[], window: number): number[] {
  const result = new Array<number>(data.length).fill(NaN);
  for (let i = window - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += data[j];
    const mean = sum / window;
    let variance = 0;
    for (let j = i - window + 1; j <= i; j++) variance += (data[j] - mean) ** 2;
    result[i] = Math.sqrt(variance / window);
  }
  return result;
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
