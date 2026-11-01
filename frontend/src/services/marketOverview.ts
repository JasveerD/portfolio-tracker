import type { PricePoint } from "../types";

const TWELVE_DATA = "https://api.twelvedata.com";
const FINNHUB = "https://finnhub.io/api/v1";
const CACHE_TTL = 30 * 60 * 1000;

export type Provider = "twelvedata" | "finnhub";

export function getProvider(): Provider {
  try {
    const v = localStorage.getItem("market_provider");
    if (v === "finnhub") return "finnhub";
  } catch {
    // ignore
  }
  return "twelvedata";
}

export function setProvider(p: Provider) {
  try {
    localStorage.setItem("market_provider", p);
  } catch {
    // ignore
  }
}

export function getProviderKey(p: Provider): string {
  try {
    if (p === "finnhub") return localStorage.getItem("finnhub_key") || "";
    return localStorage.getItem("twelve_data_key") || "demo";
  } catch {
    return p === "twelvedata" ? "demo" : "";
  }
}

export function setProviderKey(p: Provider, key: string) {
  try {
    if (p === "finnhub") localStorage.setItem("finnhub_key", key);
    else localStorage.setItem("twelve_data_key", key);
  } catch {
    // ignore
  }
}

export function needsDelay(): boolean {
  return getProvider() === "twelvedata" && getProviderKey("twelvedata") === "demo";
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

async function fetchTwelveDataQuote(
  ticker: string,
  name: string,
  apiKey: string
): Promise<TickerQuote> {
  const url = `${TWELVE_DATA}/time_series?symbol=${ticker}&interval=1day&outputsize=2&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (res.status === 401 || res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`${res.status}`);

  const data = await res.json();
  if (data.code === 429 || data.message?.includes("minute"))
    throw new Error("rate_limited");
  if (data.status !== "ok" || !data.values?.length)
    throw new Error(data.message || "No data");

  const cur = parseFloat(data.values[0].close);
  const prev = data.values.length > 1 ? parseFloat(data.values[1].close) : cur;
  const change = cur - prev;
  const changePct = prev > 0 ? (change / prev) * 100 : 0;

  return {
    ticker,
    name,
    price: Math.round(cur * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
  };
}

async function fetchFinnhubQuote(
  ticker: string,
  name: string,
  apiKey: string
): Promise<TickerQuote> {
  const url = `${FINNHUB}/quote?symbol=${ticker}&token=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (res.status === 401 || res.status === 403) throw new Error("invalid_key");
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`${res.status}`);

  const data = await res.json();
  if (!data.c || data.c === 0) throw new Error("No data");

  return {
    ticker,
    name,
    price: Math.round(data.c * 100) / 100,
    change: Math.round(data.d * 100) / 100,
    changePct: Math.round(data.dp * 100) / 100,
  };
}

export async function fetchTickerQuote(
  ticker: string,
  name: string
): Promise<TickerQuote> {
  const cacheKey = `mkt_${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  const apiKey = getProviderKey(provider);

  let quote: TickerQuote;
  if (provider === "finnhub" && apiKey) {
    quote = await fetchFinnhubQuote(ticker, name, apiKey);
  } else {
    quote = await fetchTwelveDataQuote(ticker, name, apiKey || "demo");
  }

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

async function fetchFinnhubNews(apiKey: string): Promise<NewsArticle[]> {
  const url = `${FINNHUB}/news?category=general&token=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Finnhub news returned ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return [];

  return data.slice(0, 20).map(
    (item: {
      headline: string;
      summary: string;
      url: string;
      source: string;
      image: string;
      datetime: number;
      category: string;
    }) => ({
      title: item.headline,
      summary: item.summary?.slice(0, 200) || "",
      url: item.url,
      source: item.source,
      image: item.image || null,
      publishedAt: new Date(item.datetime * 1000).toISOString().slice(0, 16).replace("T", " "),
      sentiment: "",
    })
  );
}

export async function fetchMarketNews(): Promise<NewsArticle[]> {
  const cached = getNewsCached();
  if (cached) return cached;

  const provider = getProvider();
  const finnhubKey = getProviderKey("finnhub");

  let articles: NewsArticle[] = [];

  if (provider === "finnhub" && finnhubKey) {
    articles = await fetchFinnhubNews(finnhubKey);
  }

  if (articles.length === 0 && finnhubKey) {
    try {
      articles = await fetchFinnhubNews(finnhubKey);
    } catch {
      // fall through
    }
  }

  if (articles.length > 0) {
    try {
      sessionStorage.setItem(
        "mkt_news",
        JSON.stringify({ data: articles, ts: Date.now() })
      );
    } catch {
      // ignore
    }
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
  const apiKey = getProviderKey("twelvedata");
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
