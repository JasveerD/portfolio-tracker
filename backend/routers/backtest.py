from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import BacktestRequest, BacktestResult
from services.backtest_engine import run_backtest
from services.market_data import fetch_and_cache

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


@router.post("", response_model=BacktestResult)
def backtest(
    payload: BacktestRequest, db: Session = Depends(get_db)
) -> BacktestResult:
    prices = fetch_and_cache(db, payload.ticker, payload.start_date, payload.end_date)
    if len(prices) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough price data for {payload.ticker} in the given date range",
        )
    try:
        result = run_backtest(
            prices=prices,
            strategy=payload.strategy,
            initial_capital=payload.initial_capital,
            params=payload.params,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return BacktestResult(**result)
