import type { PricePoint } from "../types";
import { getProvider, getProviderKey } from "./marketOverview";

const TWELVE_DATA = "https://api.twelvedata.com";
const FINNHUB = "https://finnhub.io/api/v1";
const CACHE_TTL = 30 * 60 * 1000;

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // storage full — clear old backtest entries and retry
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("bt_")) sessionStorage.removeItem(k);
      }
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // give up
    }
  }
}

interface TwelveDataResponse {
  status: string;
  code?: number;
  values?: {
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }[];
  message?: string;
}

function parseTwelveData(
  data: TwelveDataResponse,
  ticker: string
): PricePoint[] {
  if (data.status !== "ok" || !data.values?.length)
    throw new Error(data.message || `No data for ${ticker}`);

  return data.values
    .map((v) => ({
      date: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume, 10),
    }))
    .reverse();
}

async function fetchTwelveDataWithKey(
  ticker: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<PricePoint[]> {
  const url = `${TWELVE_DATA}/time_series?symbol=${ticker.toUpperCase()}&interval=1day&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    if (res.status === 401 && apiKey === "demo") {
      throw new Error("demo_limit");
    }
    throw new Error(`Twelve Data ${res.status}`);
  }
  const data: TwelveDataResponse = await res.json();
  if (data.status === "error" && data.message?.includes("demo")) {
    throw new Error("demo_limit");
  }
  return parseTwelveData(data, ticker);
}

async function fetchTwelveData(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<PricePoint[]> {
  const key = getProviderKey("twelvedata");
  try {
    return await fetchTwelveDataWithKey(ticker, startDate, endDate, key);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // If user's custom key fails with auth error, retry with demo
    if (key !== "demo" && (msg.includes("401") || msg.includes("403"))) {
      return await fetchTwelveDataWithKey(ticker, startDate, endDate, "demo");
    }
    throw e;
  }
}

async function fetchFinnhubCandles(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<PricePoint[]> {
  const key = getProviderKey("finnhub");
  if (!key) throw new Error("No Finnhub API key configured");

  const from = Math.floor(new Date(startDate).getTime() / 1000);
  const to = Math.floor(new Date(endDate).getTime() / 1000);
  const url = `${FINNHUB}/stock/candle?symbol=${ticker.toUpperCase()}&resolution=D&from=${from}&to=${to}&token=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Finnhub returned ${res.status}`);

  const data = await res.json();
  if (data.s !== "ok" || !data.c?.length)
    throw new Error(`No candle data for ${ticker}`);

  const points: PricePoint[] = [];
  for (let i = 0; i < data.c.length; i++) {
    points.push({
      date: new Date(data.t[i] * 1000).toISOString().slice(0, 10),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    });
  }
  return points;
}

export async function fetchPriceHistory(
  ticker: string,
  period1: string,
  period2: string
): Promise<PricePoint[]> {
  const cacheKey = `bt_${ticker}_${period1}_${period2}`;
  const cached = getCached<PricePoint[]>(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  const errors: string[] = [];

  // Try the user's configured provider first
  if (provider === "finnhub") {
    try {
      const pts = await fetchFinnhubCandles(ticker, period1, period2);
      setCache(cacheKey, pts);
      return pts;
    } catch (e) {
      errors.push(`Finnhub: ${e instanceof Error ? e.message : "failed"}`);
    }
    // Fallback to Twelve Data
    try {
      const pts = await fetchTwelveData(ticker, period1, period2);
      setCache(cacheKey, pts);
      return pts;
    } catch (e) {
      errors.push(`Twelve Data: ${e instanceof Error ? e.message : "failed"}`);
    }
  } else {
    try {
      const pts = await fetchTwelveData(ticker, period1, period2);
      setCache(cacheKey, pts);
      return pts;
    } catch (e) {
      errors.push(`Twelve Data: ${e instanceof Error ? e.message : "failed"}`);
    }
    // Fallback to Finnhub if key exists
    const fKey = getProviderKey("finnhub");
    if (fKey) {
      try {
        const pts = await fetchFinnhubCandles(ticker, period1, period2);
        setCache(cacheKey, pts);
        return pts;
      } catch (e) {
        errors.push(`Finnhub: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
  }

  const isDemoLimit = errors.some((e) => e.includes("demo_limit"));
  if (isDemoLimit) {
    throw new Error(
      `The demo API key doesn't support ${ticker}. Get a free API key at twelvedata.com or finnhub.io and add it in Market → API Settings.`
    );
  }

  throw new Error(
    `Could not fetch price data for ${ticker}. ${errors.join(" | ")}. Check your API key in Market → API Settings.`
  );
}

export async function fetchCurrentPrice(
  ticker: string
): Promise<number | null> {
  const cacheKey = `price_${ticker}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;

  const provider = getProvider();

  if (provider === "finnhub") {
    try {
      const key = getProviderKey("finnhub");
      if (key) {
        const url = `${FINNHUB}/quote?symbol=${ticker.toUpperCase()}&token=${key}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const data = await res.json();
          if (data.c && data.c > 0) {
            setCache(cacheKey, data.c);
            return data.c;
          }
        }
      }
    } catch {
      // fallback below
    }
  }

  // Twelve Data quote — try user key then demo
  for (const tdKey of [...new Set([getProviderKey("twelvedata"), "demo"])]) {
    try {
      const url = `${TWELVE_DATA}/price?symbol=${ticker.toUpperCase()}&apikey=${tdKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        if (data.price) {
          const price = parseFloat(data.price);
          setCache(cacheKey, price);
          return price;
        }
      }
      if (res.status === 401 || res.status === 403) continue;
      break;
    } catch {
      break;
    }
  }

  // Finnhub fallback if not already tried
  if (provider !== "finnhub") {
    try {
      const key = getProviderKey("finnhub");
      if (key) {
        const url = `${FINNHUB}/quote?symbol=${ticker.toUpperCase()}&token=${key}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const data = await res.json();
          if (data.c && data.c > 0) {
            setCache(cacheKey, data.c);
            return data.c;
          }
        }
      }
    } catch {
      // give up
    }
  }

  return null;
}

const PERIOD_DAYS: Record<string, number> = {
  "1mo": 30,
  "3mo": 90,
  "6mo": 180,
  "1y": 365,
  "2y": 730,
  "5y": 1825,
};

export async function fetchHistoryByPeriod(
  ticker: string,
  period = "1y"
): Promise<PricePoint[]> {
  const days = PERIOD_DAYS[period] ?? 365;
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return fetchPriceHistory(
    ticker,
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10)
  );
}
