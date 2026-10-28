from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Holding
from schemas import PortfolioSummary
from services.market_data import get_current_price

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummary)
def portfolio_summary(db: Session = Depends(get_db)) -> PortfolioSummary:
    holdings = db.query(Holding).all()

    total_value = 0.0
    total_cost = 0.0
    allocations = []

    for h in holdings:
        cost = h.shares * h.buy_price
        price = get_current_price(h.ticker)
        value = h.shares * price if price else cost
        total_cost += cost
        total_value += value
        allocations.append({"ticker": h.ticker, "value": round(value, 2)})

    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0.0

    return PortfolioSummary(
        total_value=round(total_value, 2),
        total_cost=round(total_cost, 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_pct=round(total_pnl_pct, 2),
        allocations=allocations,
    )
