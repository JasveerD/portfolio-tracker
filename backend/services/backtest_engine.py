import numpy as np
import pandas as pd


def run_backtest(
    prices: list[dict],
    strategy: str,
    initial_capital: float,
    params: dict,
) -> dict:
    df = pd.DataFrame(prices)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    if len(df) < 2:
        raise ValueError("Not enough price data for backtesting")

    close = df["close"].values
    dates = df["date"].values

    signals = _generate_signals(close, strategy, params)

    equity_curve, trades = _simulate(dates, close, signals, initial_capital)
    buy_hold_curve = _buy_and_hold(dates, close, initial_capital)
    drawdown_curve = _compute_drawdown_series(equity_curve)
    metrics = _compute_metrics(equity_curve, trades, dates)

    return {
        "equity_curve": [
            {"date": str(np.datetime_as_string(e["date"], unit="D")), "value": round(e["value"], 2)}
            for e in equity_curve
        ],
        "buy_hold_curve": [
            {"date": str(np.datetime_as_string(b["date"], unit="D")), "value": round(b["value"], 2)}
            for b in buy_hold_curve
        ],
        "drawdown_curve": [
            {"date": str(np.datetime_as_string(d["date"], unit="D")), "value": round(d["value"], 4)}
            for d in drawdown_curve
        ],
        "trades": trades,
        "metrics": metrics,
    }


def _generate_signals(close: np.ndarray, strategy: str, params: dict) -> np.ndarray:
    n = len(close)
    signals = np.zeros(n)  # 0 = hold, 1 = buy, -1 = sell

    if strategy == "sma_crossover":
        short_w = params.get("short_window", 20)
        long_w = params.get("long_window", 50)
        short_sma = _sma(close, short_w)
        long_sma = _sma(close, long_w)
        for i in range(1, n):
            if short_sma[i] > long_sma[i] and short_sma[i - 1] <= long_sma[i - 1]:
                signals[i] = 1
            elif short_sma[i] < long_sma[i] and short_sma[i - 1] >= long_sma[i - 1]:
                signals[i] = -1

    elif strategy == "rsi":
        period = params.get("period", 14)
        oversold = params.get("oversold", 30)
        overbought = params.get("overbought", 70)
        rsi = _rsi(close, period)
        for i in range(1, n):
            if rsi[i] < oversold and rsi[i - 1] >= oversold:
                signals[i] = 1
            elif rsi[i] > overbought and rsi[i - 1] <= overbought:
                signals[i] = -1

    elif strategy == "bollinger_bands":
        period = params.get("period", 20)
        std_mult = params.get("std_dev", 2.0)
        sma = _sma(close, period)
        std = _rolling_std(close, period)
        upper = sma + std_mult * std
        lower = sma - std_mult * std
        for i in range(1, n):
            if close[i] <= lower[i] and close[i - 1] > lower[i - 1]:
                signals[i] = 1
            elif close[i] >= upper[i] and close[i - 1] < upper[i - 1]:
                signals[i] = -1

    elif strategy == "macd":
        fast = params.get("fast_period", 12)
        slow = params.get("slow_period", 26)
        signal_period = params.get("signal_period", 9)
        ema_fast = _ema(close, fast)
        ema_slow = _ema(close, slow)
        macd_line = ema_fast - ema_slow
        signal_line = _ema(macd_line, signal_period)
        for i in range(1, n):
            if macd_line[i] > signal_line[i] and macd_line[i - 1] <= signal_line[i - 1]:
                signals[i] = 1
            elif macd_line[i] < signal_line[i] and macd_line[i - 1] >= signal_line[i - 1]:
                signals[i] = -1

    elif strategy == "buy_and_hold":
        signals[0] = 1

    else:
        raise ValueError(f"Unknown strategy: {strategy}")

    return signals


def _simulate(
    dates: np.ndarray,
    close: np.ndarray,
    signals: np.ndarray,
    initial_capital: float,
) -> tuple[list[dict], list[dict]]:
    cash = initial_capital
    shares = 0.0
    entry_price = 0.0
    entry_date = None
    trades = []
    equity = []

    for i in range(len(close)):
        if signals[i] == 1 and shares == 0:
            shares = cash / close[i]
            entry_price = close[i]
            entry_date = dates[i]
            cash = 0.0
        elif signals[i] == -1 and shares > 0:
            cash = shares * close[i]
            pnl = (close[i] - entry_price) * shares
            pnl_pct = (close[i] / entry_price - 1) * 100
            holding_days = (dates[i] - entry_date) / np.timedelta64(1, "D")
            trades.append({
                "entry_date": str(np.datetime_as_string(entry_date, unit="D")),
                "exit_date": str(np.datetime_as_string(dates[i], unit="D")),
                "entry_price": round(float(entry_price), 2),
                "exit_price": round(float(close[i]), 2),
                "pnl": round(float(pnl), 2),
                "pnl_pct": round(float(pnl_pct), 2),
                "holding_days": int(holding_days),
            })
            shares = 0.0
            entry_price = 0.0
            entry_date = None

        portfolio_value = cash + shares * close[i]
        equity.append({"date": dates[i], "value": float(portfolio_value)})

    return equity, trades


def _buy_and_hold(
    dates: np.ndarray, close: np.ndarray, initial_capital: float
) -> list[dict]:
    shares = initial_capital / close[0]
    return [{"date": dates[i], "value": float(shares * close[i])} for i in range(len(close))]


def _compute_drawdown_series(equity: list[dict]) -> list[dict]:
    values = np.array([e["value"] for e in equity])
    peak = np.maximum.accumulate(values)
    drawdown = (values - peak) / peak
    return [{"date": equity[i]["date"], "value": float(drawdown[i])} for i in range(len(equity))]


def _compute_metrics(
    equity: list[dict], trades: list[dict], dates: np.ndarray
) -> dict:
    values = np.array([e["value"] for e in equity])
    initial = values[0]
    final = values[-1]

    total_return = (final / initial - 1) * 100
    total_days = (dates[-1] - dates[0]) / np.timedelta64(1, "D")
    years = max(total_days / 365.25, 0.01)
    annualized_return = ((final / initial) ** (1 / years) - 1) * 100

    daily_returns = np.diff(values) / values[:-1]
    sharpe = 0.0
    if len(daily_returns) > 1 and np.std(daily_returns) > 0:
        sharpe = (np.mean(daily_returns) / np.std(daily_returns)) * np.sqrt(252)

    peak = np.maximum.accumulate(values)
    drawdown = (values - peak) / peak
    max_drawdown = float(np.min(drawdown)) * 100

    num_trades = len(trades)
    winning = [t for t in trades if t["pnl"] > 0]
    win_rate = (len(winning) / num_trades * 100) if num_trades > 0 else 0.0

    return {
        "total_return_pct": round(float(total_return), 2),
        "annualized_return_pct": round(float(annualized_return), 2),
        "sharpe_ratio": round(float(sharpe), 2),
        "max_drawdown_pct": round(float(max_drawdown), 2),
        "win_rate_pct": round(float(win_rate), 2),
        "num_trades": num_trades,
        "total_pnl": round(sum(t["pnl"] for t in trades), 2),
    }


def _sma(data: np.ndarray, window: int) -> np.ndarray:
    result = np.full_like(data, np.nan)
    for i in range(window - 1, len(data)):
        result[i] = np.mean(data[i - window + 1 : i + 1])
    return result


def _ema(data: np.ndarray, window: int) -> np.ndarray:
    result = np.full_like(data, np.nan, dtype=float)
    result[0] = data[0]
    multiplier = 2 / (window + 1)
    for i in range(1, len(data)):
        result[i] = data[i] * multiplier + result[i - 1] * (1 - multiplier)
    return result


def _rsi(data: np.ndarray, period: int) -> np.ndarray:
    result = np.full_like(data, 50.0, dtype=float)
    deltas = np.diff(data)
    for i in range(period, len(data)):
        gains = deltas[max(0, i - period) : i]
        up = np.mean(gains[gains > 0]) if np.any(gains > 0) else 0.0
        down = -np.mean(gains[gains < 0]) if np.any(gains < 0) else 0.0
        if down == 0:
            result[i] = 100.0
        else:
            rs = up / down
            result[i] = 100 - 100 / (1 + rs)
    return result


def _rolling_std(data: np.ndarray, window: int) -> np.ndarray:
    result = np.full_like(data, np.nan)
    for i in range(window - 1, len(data)):
        result[i] = np.std(data[i - window + 1 : i + 1])
    return result
