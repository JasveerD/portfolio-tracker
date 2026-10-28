from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Holding
from schemas import HoldingCreate, HoldingResponse, HoldingUpdate
from services.market_data import get_current_price

router = APIRouter(prefix="/api/holdings", tags=["holdings"])


@router.get("", response_model=list[HoldingResponse])
def list_holdings(db: Session = Depends(get_db)) -> list[HoldingResponse]:
    holdings = db.query(Holding).all()
    results = []
    for h in holdings:
        price = get_current_price(h.ticker)
        gain_loss = ((price / h.buy_price) - 1) * 100 if price else None
        results.append(
            HoldingResponse(
                id=h.id,
                ticker=h.ticker,
                shares=h.shares,
                buy_price=h.buy_price,
                buy_date=h.buy_date,
                current_price=price,
                gain_loss_pct=round(gain_loss, 2) if gain_loss is not None else None,
            )
        )
    return results


@router.post("", response_model=HoldingResponse, status_code=201)
def create_holding(
    payload: HoldingCreate, db: Session = Depends(get_db)
) -> HoldingResponse:
    holding = Holding(
        ticker=payload.ticker.upper(),
        shares=payload.shares,
        buy_price=payload.buy_price,
        buy_date=payload.buy_date,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    price = get_current_price(holding.ticker)
    gain_loss = ((price / holding.buy_price) - 1) * 100 if price else None
    return HoldingResponse(
        id=holding.id,
        ticker=holding.ticker,
        shares=holding.shares,
        buy_price=holding.buy_price,
        buy_date=holding.buy_date,
        current_price=price,
        gain_loss_pct=round(gain_loss, 2) if gain_loss is not None else None,
    )


@router.put("/{holding_id}", response_model=HoldingResponse)
def update_holding(
    holding_id: int, payload: HoldingUpdate, db: Session = Depends(get_db)
) -> HoldingResponse:
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    if payload.ticker is not None:
        holding.ticker = payload.ticker.upper()
    if payload.shares is not None:
        holding.shares = payload.shares
    if payload.buy_price is not None:
        holding.buy_price = payload.buy_price
    if payload.buy_date is not None:
        holding.buy_date = payload.buy_date
    db.commit()
    db.refresh(holding)
    price = get_current_price(holding.ticker)
    gain_loss = ((price / holding.buy_price) - 1) * 100 if price else None
    return HoldingResponse(
        id=holding.id,
        ticker=holding.ticker,
        shares=holding.shares,
        buy_price=holding.buy_price,
        buy_date=holding.buy_date,
        current_price=price,
        gain_loss_pct=round(gain_loss, 2) if gain_loss is not None else None,
    )


@router.delete("/{holding_id}", status_code=204)
def delete_holding(holding_id: int, db: Session = Depends(get_db)) -> None:
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
