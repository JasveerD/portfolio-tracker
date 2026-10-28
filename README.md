# Portfolio Tracker

A full-stack stock portfolio tracker with a strategy backtesting engine.

## Features

- **Portfolio Management** — CRUD for holdings with live prices, P&L tracking, and allocation charts
- **Market Data** — Historical OHLCV data via yfinance with SQLite caching
- **Backtesting Engine** — Test 5 strategies (SMA Crossover, RSI, Bollinger Bands, MACD, Buy & Hold) with configurable parameters, equity curves, drawdown charts, and trade logs

## Tech Stack

- **Frontend:** React + TypeScript + Vite, TailwindCSS, Recharts
- **Backend:** Python FastAPI, SQLAlchemy, SQLite
- **Market Data:** yfinance

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:main --reload
```

The API runs at `http://localhost:8000`. The SQLite database (`portfolio.db`) is created automatically.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. API calls are proxied to the backend via Vite config.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holdings` | List all holdings |
| POST | `/api/holdings` | Add a holding |
| PUT | `/api/holdings/{id}` | Update a holding |
| DELETE | `/api/holdings/{id}` | Remove a holding |
| GET | `/api/portfolio/summary` | Portfolio value, P&L, allocation |
| GET | `/api/market/{ticker}/history?period=1y` | Historical price data |
| POST | `/api/backtest` | Run a backtest |

## Backtest Strategies

- **SMA Crossover** — Buy when short SMA crosses above long SMA, sell on cross below
- **RSI** — Buy when RSI drops below oversold threshold, sell above overbought
- **Bollinger Bands** — Buy at lower band, sell at upper band
- **MACD** — Buy on bullish crossover, sell on bearish crossover
- **Buy & Hold** — Baseline comparison
