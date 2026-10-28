from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas import PricePoint
from services.market_data import fetch_and_cache

router = APIRouter(prefix="/api/market", tags=["market"])

PERIOD_DAYS = {
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "2y": 730,
    "5y": 1825,
}


@router.get("/{ticker}/history", response_model=list[PricePoint])
def price_history(
    ticker: str,
    period: str = Query(default="1y"),
    db: Session = Depends(get_db),
) -> list[PricePoint]:
    days = PERIOD_DAYS.get(period, 365)
    end = date.today()
    start = end - timedelta(days=days)
    prices = fetch_and_cache(db, ticker, start, end)
    return [PricePoint(**p) for p in prices]
