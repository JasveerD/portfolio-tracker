import type { Holding, HoldingCreate } from "../types";

const STORAGE_KEY = "portfolio-tracker-holdings";

function readHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHoldings(holdings: Holding[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch {
    // storage full or unavailable
  }
}

let nextId = 0;

function getNextId(holdings: Holding[]): number {
  if (nextId === 0 && holdings.length > 0) {
    nextId = Math.max(...holdings.map((h) => h.id)) + 1;
  }
  return ++nextId;
}

export function getHoldings(): Holding[] {
  return readHoldings();
}

export function addHolding(data: HoldingCreate): Holding {
  const holdings = readHoldings();
  const holding: Holding = {
    id: getNextId(holdings),
    ticker: data.ticker.toUpperCase(),
    shares: data.shares,
    buy_price: data.buy_price,
    buy_date: data.buy_date,
    current_price: null,
    gain_loss_pct: null,
  };
  holdings.push(holding);
  writeHoldings(holdings);
  return holding;
}

export function updateHolding(
  id: number,
  data: Partial<HoldingCreate>
): Holding | null {
  const holdings = readHoldings();
  const idx = holdings.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  if (data.ticker !== undefined)
    holdings[idx].ticker = data.ticker.toUpperCase();
  if (data.shares !== undefined) holdings[idx].shares = data.shares;
  if (data.buy_price !== undefined) holdings[idx].buy_price = data.buy_price;
  if (data.buy_date !== undefined) holdings[idx].buy_date = data.buy_date;
  writeHoldings(holdings);
  return holdings[idx];
}

export function deleteHolding(id: number): boolean {
  const holdings = readHoldings();
  const filtered = holdings.filter((h) => h.id !== id);
  if (filtered.length === holdings.length) return false;
  writeHoldings(filtered);
  return true;
}
