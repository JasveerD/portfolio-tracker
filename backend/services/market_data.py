from datetime import date, datetime, timedelta

import yfinance as yf
from sqlalchemy import and_
from sqlalchemy.orm import Session

from models import PriceCache


def get_cached_prices(
    db: Session, ticker: str, start: date, end: date
) -> list[PriceCache]:
    return (
        db.query(PriceCache)
        .filter(
            and_(
                PriceCache.ticker == ticker.upper(),
                PriceCache.date >= start,
                PriceCache.date <= end,
            )
        )
        .order_by(PriceCache.date)
        .all()
    )


def fetch_and_cache(
    db: Session, ticker: str, start: date, end: date
) -> list[dict]:
    ticker_upper = ticker.upper()
    cached = get_cached_prices(db, ticker_upper, start, end)

    cached_dates = {row.date for row in cached}
    if cached_dates:
        missing_start = start
        missing_end = end
    else:
        missing_start = start
        missing_end = end

    need_fetch = not cached_dates or (end - start).days + 1 > len(cached_dates)

    if need_fetch:
        fetch_start = start - timedelta(days=5)
        fetch_end = end + timedelta(days=1)
        df = yf.download(
            ticker_upper,
            start=fetch_start.isoformat(),
            end=fetch_end.isoformat(),
            progress=False,
            auto_adjust=True,
        )
        if df.empty:
            return [_row_to_dict(r) for r in cached]

        if hasattr(df.columns, "levels") and df.columns.nlevels > 1:
            df = df.droplevel(level=1, axis=1)

        new_rows = []
        for idx, row in df.iterrows():
            d = idx.date()
            if d < start or d > end:
                continue
            if d in cached_dates:
                continue
            new_rows.append(
                PriceCache(
                    ticker=ticker_upper,
                    date=d,
                    open=float(row["Open"]),
                    high=float(row["High"]),
                    low=float(row["Low"]),
                    close=float(row["Close"]),
                    volume=float(row["Volume"]),
                    fetched_at=datetime.utcnow(),
                )
            )
        if new_rows:
            db.add_all(new_rows)
            db.commit()

        cached = get_cached_prices(db, ticker_upper, start, end)

    return [_row_to_dict(r) for r in cached]


def get_current_price(ticker: str) -> float | None:
    try:
        t = yf.Ticker(ticker.upper())
        hist = t.history(period="1d")
        if hist.empty:
            return None
        return float(hist["Close"].iloc[-1])
    except Exception:
        return None


def _row_to_dict(row: PriceCache) -> dict:
    return {
        "date": row.date.isoformat(),
        "open": row.open,
        "high": row.high,
        "low": row.low,
        "close": row.close,
        "volume": row.volume,
    }
