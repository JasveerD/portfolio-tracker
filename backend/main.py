from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import backtest, holdings, market, portfolio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portfolio Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(holdings.router)
app.include_router(portfolio.router)
app.include_router(market.router)
app.include_router(backtest.router)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}
