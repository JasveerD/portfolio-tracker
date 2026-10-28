from datetime import date
from typing import Optional

from pydantic import BaseModel


class HoldingCreate(BaseModel):
    ticker: str
    shares: float
    buy_price: float
    buy_date: date


class HoldingUpdate(BaseModel):
    ticker: Optional[str] = None
    shares: Optional[float] = None
    buy_price: Optional[float] = None
    buy_date: Optional[date] = None


class HoldingResponse(BaseModel):
    id: int
    ticker: str
    shares: float
    buy_price: float
    buy_date: date
    current_price: Optional[float] = None
    gain_loss_pct: Optional[float] = None

    model_config = {"from_attributes": True}


class PortfolioSummary(BaseModel):
    total_value: float
    total_cost: float
    total_pnl: float
    total_pnl_pct: float
    allocations: list[dict]


class PricePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class BacktestRequest(BaseModel):
    ticker: str
    strategy: str
    start_date: date
    end_date: date
    initial_capital: float = 10000.0
    params: dict = {}


class Trade(BaseModel):
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    pnl: float
    pnl_pct: float
    holding_days: int


class BacktestResult(BaseModel):
    equity_curve: list[dict]
    buy_hold_curve: list[dict]
    drawdown_curve: list[dict]
    trades: list[Trade]
    metrics: dict
