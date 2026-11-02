# FishyTerminal

Bloomberg-style portfolio tracker and strategy backtester. Runs entirely in the browser — no backend, no account required.

**Live:** [jasveerd.github.io/portfolio-tracker](https://jasveerd.github.io/portfolio-tracker/)

## Features

**Portfolio** — Track holdings with live prices, P&L, cost basis, and allocation breakdown.

**Backtesting** — Test 5 strategies (SMA Crossover, RSI, Bollinger Bands, MACD, Buy & Hold) with equity curves, drawdown charts, trade logs, Monte Carlo VaR, Kelly criterion, efficient frontier, and scenario testing.

**Technical Analysis** — Bollinger Bands, RSI, MACD charts. Relative strength vs any benchmark, rolling performance vs SPY, and seasonality heatmaps.

**Market Overview** — Indices, commodities, global markets, sector heatmap, market movers, VIX gauge, pairs trading scanner, watchlist, and news feed.

## Data Sources

1. **Yahoo Finance** (primary) — Free, no API key, every ticker. Requires a CORS proxy (included Cloudflare Worker).
2. **Finnhub** — 60 req/min free tier. Provides candles, quotes, news, and company metrics.
3. **Twelve Data** — 800 req/day free tier. Works with `demo` key for AAPL/MSFT/AMZN/GOOGL/TSLA.

Providers are configured in **MKT → API Settings**. Yahoo is tried first when a proxy URL is set.

## Setup

```bash
cd frontend
npm install
npm run dev
```

### Deploy the Yahoo Finance proxy

The `worker/` directory contains a Cloudflare Worker that proxies Yahoo Finance requests (adds CORS headers). Free tier = 100k requests/day.

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

Paste the deployed URL (e.g. `https://yahoo-finance-proxy.jasveerd.workers.dev`) into **MKT → API Settings → Yahoo Finance Proxy**.

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS + Recharts
- Cloudflare Workers (Yahoo Finance proxy)
- localStorage (holdings, settings) + sessionStorage (data cache)
- GitHub Pages + GitHub Actions CI/CD

## Project Structure

```
frontend/src/
  components/
    analysis/     Technical charts, relative strength, seasonality
    backtest/     Strategy form, equity curve, risk metrics, Monte Carlo
    market/       Indices, commodities, news, watchlist, sector heatmap
    portfolio/    Holdings, allocation chart
  pages/          Dashboard, Portfolio, Backtest, Market
  services/       API clients, data fetching, storage
  types.ts        Shared TypeScript interfaces
worker/           Cloudflare Worker (Yahoo Finance CORS proxy)
```
