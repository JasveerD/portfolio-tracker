import type { PricePoint } from "../types";

const TWELVE_DATA = "https://api.twelvedata.com";
const AV_BASE = "https://www.alphavantage.co/query";
const CACHE_TTL = 30 * 60 * 1000;

function getApiKey(): string {
  try {
    return localStorage.getItem("twelve_data_key") || "demo";
  } catch {
    return "demo";
  }
}

export function setApiKey(key: string) {
  try {
    localStorage.setItem("twelve_data_key", key);
  } catch {
    // ignore
  }
}

export function getStoredApiKey(): string {
  return getApiKey();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface TickerQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  loading?: boolean;
  error?: boolean;
}

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  image: string | null;
  publishedAt: string;
  sentiment: string;
}

export const INDICES = [
  { ticker: "SPY", name: "S&P 500" },
  { ticker: "QQQ", name: "Nasdaq 100" },
  { ticker: "DIA", name: "Dow Jones" },
  { ticker: "IWM", name: "Russell 2000" },
];

export const SECTORS = [
  { ticker: "XLK", name: "Technology" },
  { ticker: "XLF", name: "Financials" },
  { ticker: "XLE", name: "Energy" },
  { ticker: "XLV", name: "Healthcare" },
  { ticker: "XLY", name: "Cons. Disc." },
  { ticker: "XLP", name: "Cons. Staples" },
  { ticker: "XLI", name: "Industrials" },
  { ticker: "XLB", name: "Materials" },
  { ticker: "XLRE", name: "Real Estate" },
  { ticker: "XLU", name: "Utilities" },
  { ticker: "XLC", name: "Comm. Svcs." },
];

function getCached(key: string): TickerQuote | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(key: string, data: TickerQuote) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore
  }
}

export async function fetchTickerQuote(
  ticker: string,
  name: string
): Promise<TickerQuote> {
  const cacheKey = `mkt_${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const url = `${TWELVE_DATA}/time_series?symbol=${ticker}&interval=1day&outputsize=2&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (res.status === 401 || res.status === 429) {
    throw new Error("rate_limited");
  }
  if (!res.ok) throw new Error(`${res.status}`);

  const data = await res.json();
  if (data.code === 429 || data.message?.includes("minute")) {
    throw new Error("rate_limited");
  }
  if (data.status !== "ok" || !data.values?.length)
    throw new Error(data.message || "No data");

  const cur = parseFloat(data.values[0].close);
  const prev =
    data.values.length > 1 ? parseFloat(data.values[1].close) : cur;
  const change = cur - prev;
  const changePct = prev > 0 ? (change / prev) * 100 : 0;

  const quote: TickerQuote = {
    ticker,
    name,
    price: Math.round(cur * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
  };

  setCache(cacheKey, quote);
  return quote;
}

export async function fetchTickerQuoteWithRetry(
  ticker: string,
  name: string,
  retries = 2
): Promise<TickerQuote> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchTickerQuote(ticker, name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "rate_limited" && attempt < retries) {
        await delay(8000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("exhausted retries");
}

function getNewsCached(): NewsArticle[] | null {
  try {
    const raw = sessionStorage.getItem("mkt_news");
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchMarketNews(): Promise<NewsArticle[]> {
  const cached = getNewsCached();
  if (cached) return cached;

  const url = `${AV_BASE}?function=NEWS_SENTIMENT&topics=financial_markets&apikey=demo`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`News API returned ${res.status}`);

  const data = await res.json();
  if (!data.feed?.length) return [];

  const articles: NewsArticle[] = data.feed.slice(0, 20).map(
    (item: {
      title: string;
      summary: string;
      url: string;
      source: string;
      banner_image: string | null;
      time_published: string;
      overall_sentiment_label: string;
    }) => ({
      title: item.title,
      summary: item.summary?.slice(0, 200) || "",
      url: item.url,
      source: item.source,
      image: item.banner_image || null,
      publishedAt: formatPublishedTime(item.time_published),
      sentiment: item.overall_sentiment_label,
    })
  );

  try {
    sessionStorage.setItem(
      "mkt_news",
      JSON.stringify({ data: articles, ts: Date.now() })
    );
  } catch {
    // ignore
  }

  return articles;
}

function formatPublishedTime(raw: string): string {
  if (!raw || raw.length < 8) return raw;
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const h = raw.slice(9, 11) || "00";
  const min = raw.slice(11, 13) || "00";
  return `${y}-${m}-${d} ${h}:${min}`;
}

export async function fetchSectorHistory(
  ticker: string
): Promise<PricePoint[]> {
  const apiKey = getApiKey();
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 86400000);
  const url = `${TWELVE_DATA}/time_series?symbol=${ticker}&interval=1day&start_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  if (data.status !== "ok" || !data.values?.length) throw new Error("No data");

  return data.values
    .map(
      (v: {
        datetime: string;
        open: string;
        high: string;
        low: string;
        close: string;
        volume: string;
      }) => ({
        date: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume, 10),
      })
    )
    .reverse();
}
