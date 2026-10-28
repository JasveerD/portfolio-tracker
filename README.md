# Portfolio Tracker

A client-side stock portfolio tracker with a strategy backtesting engine. No backend required — runs entirely in the browser.

**Live:** [jasveerd.github.io/portfolio-tracker](https://jasveerd.github.io/portfolio-tracker/)

## Features

- **Portfolio Management** — Add/remove holdings with live prices, P&L tracking, and allocation donut chart
- **Market Data** — Real-time prices and historical OHLCV data from Yahoo Finance
- **Backtesting Engine** — Test 5 strategies (SMA Crossover, RSI, Bollinger Bands, MACD, Buy & Hold) with configurable parameters, equity curves, drawdown charts, and trade logs
- **Dark/Light Mode** — Toggle with one click

## Tech Stack

- React + TypeScript + Vite
- TailwindCSS + Recharts
- Yahoo Finance API (via CORS proxy)
- localStorage for holdings persistence
- GitHub Pages for hosting

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Backtest Strategies

- **SMA Crossover** — Buy when short SMA crosses above long SMA, sell on cross below
- **RSI** — Buy when RSI drops below oversold threshold, sell above overbought
- **Bollinger Bands** — Buy at lower band, sell at upper band
- **MACD** — Buy on bullish crossover, sell on bearish crossover
- **Buy & Hold** — Baseline comparison
