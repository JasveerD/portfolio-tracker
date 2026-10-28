export interface Holding {
  id: number;
  ticker: string;
  shares: number;
  buy_price: number;
  buy_date: string;
  current_price: number | null;
  gain_loss_pct: number | null;
}

export interface HoldingCreate {
  ticker: string;
  shares: number;
  buy_price: number;
  buy_date: string;
}

export interface PortfolioSummary {
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_pct: number;
  allocations: { ticker: string; value: number }[];
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  pnl_pct: number;
  holding_days: number;
}

export interface BacktestRequest {
  ticker: string;
  strategy: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  params: Record<string, number>;
}

export interface BacktestResult {
  equity_curve: { date: string; value: number }[];
  buy_hold_curve: { date: string; value: number }[];
  drawdown_curve: { date: string; value: number }[];
  trades: Trade[];
  metrics: {
    total_return_pct: number;
    annualized_return_pct: number;
    sharpe_ratio: number;
    max_drawdown_pct: number;
    win_rate_pct: number;
    num_trades: number;
    total_pnl: number;
  };
}
