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

export const COMMODITIES = [
  { ticker: "GLD", name: "Gold" },
  { ticker: "USO", name: "Crude Oil" },
  { ticker: "SLV", name: "Silver" },
  { ticker: "UNG", name: "Nat Gas" },
];

export const GLOBAL_MARKETS = [
  { ticker: "INDA", name: "India" },
  { ticker: "EWJ", name: "Japan" },
  { ticker: "FXI", name: "China" },
  { ticker: "VGK", name: "Europe" },
  { ticker: "EWU", name: "UK" },
  { ticker: "EWZ", name: "Brazil" },
];

export const SECTOR_HOLDINGS: Record<
  string,
  { ticker: string; name: string }[]
> = {
  XLK: [
    { ticker: "AAPL", name: "Apple" },
    { ticker: "MSFT", name: "Microsoft" },
    { ticker: "NVDA", name: "NVIDIA" },
    { ticker: "AVGO", name: "Broadcom" },
    { ticker: "ORCL", name: "Oracle" },
    { ticker: "CRM", name: "Salesforce" },
    { ticker: "ADBE", name: "Adobe" },
    { ticker: "AMD", name: "AMD" },
  ],
  XLF: [
    { ticker: "JPM", name: "JPMorgan" },
    { ticker: "V", name: "Visa" },
    { ticker: "MA", name: "Mastercard" },
    { ticker: "BAC", name: "BofA" },
    { ticker: "WFC", name: "Wells Fargo" },
    { ticker: "GS", name: "Goldman Sachs" },
    { ticker: "MS", name: "Morgan Stanley" },
    { ticker: "BLK", name: "BlackRock" },
  ],
  XLE: [
    { ticker: "XOM", name: "Exxon Mobil" },
    { ticker: "CVX", name: "Chevron" },
    { ticker: "EOG", name: "EOG Resources" },
    { ticker: "SLB", name: "Schlumberger" },
    { ticker: "MPC", name: "Marathon Petro" },
    { ticker: "PSX", name: "Phillips 66" },
    { ticker: "VLO", name: "Valero" },
    { ticker: "OXY", name: "Occidental" },
  ],
  XLV: [
    { ticker: "LLY", name: "Eli Lilly" },
    { ticker: "UNH", name: "UnitedHealth" },
    { ticker: "JNJ", name: "J&J" },
    { ticker: "ABBV", name: "AbbVie" },
    { ticker: "MRK", name: "Merck" },
    { ticker: "TMO", name: "Thermo Fisher" },
    { ticker: "ABT", name: "Abbott" },
    { ticker: "DHR", name: "Danaher" },
  ],
  XLY: [
    { ticker: "AMZN", name: "Amazon" },
    { ticker: "TSLA", name: "Tesla" },
    { ticker: "HD", name: "Home Depot" },
    { ticker: "MCD", name: "McDonald's" },
    { ticker: "NKE", name: "Nike" },
    { ticker: "LOW", name: "Lowe's" },
    { ticker: "SBUX", name: "Starbucks" },
    { ticker: "TJX", name: "TJX Cos" },
  ],
  XLP: [
    { ticker: "PG", name: "Procter & Gamble" },
    { ticker: "COST", name: "Costco" },
    { ticker: "WMT", name: "Walmart" },
    { ticker: "KO", name: "Coca-Cola" },
    { ticker: "PEP", name: "PepsiCo" },
    { ticker: "PM", name: "Philip Morris" },
    { ticker: "MDLZ", name: "Mondelez" },
    { ticker: "MO", name: "Altria" },
  ],
  XLI: [
    { ticker: "GE", name: "GE Aerospace" },
    { ticker: "CAT", name: "Caterpillar" },
    { ticker: "RTX", name: "RTX Corp" },
    { ticker: "HON", name: "Honeywell" },
    { ticker: "UNP", name: "Union Pacific" },
    { ticker: "DE", name: "Deere & Co" },
    { ticker: "BA", name: "Boeing" },
    { ticker: "LMT", name: "Lockheed Martin" },
  ],
  XLB: [
    { ticker: "LIN", name: "Linde" },
    { ticker: "APD", name: "Air Products" },
    { ticker: "SHW", name: "Sherwin-Williams" },
    { ticker: "FCX", name: "Freeport-McMoRan" },
    { ticker: "NEM", name: "Newmont" },
    { ticker: "ECL", name: "Ecolab" },
    { ticker: "NUE", name: "Nucor" },
    { ticker: "DOW", name: "Dow Inc" },
  ],
  XLRE: [
    { ticker: "PLD", name: "Prologis" },
    { ticker: "AMT", name: "American Tower" },
    { ticker: "EQIX", name: "Equinix" },
    { ticker: "SPG", name: "Simon Property" },
    { ticker: "CCI", name: "Crown Castle" },
    { ticker: "PSA", name: "Public Storage" },
    { ticker: "O", name: "Realty Income" },
    { ticker: "DLR", name: "Digital Realty" },
  ],
  XLU: [
    { ticker: "NEE", name: "NextEra Energy" },
    { ticker: "SO", name: "Southern Co" },
    { ticker: "DUK", name: "Duke Energy" },
    { ticker: "CEG", name: "Constellation" },
    { ticker: "SRE", name: "Sempra" },
    { ticker: "AEP", name: "AEP" },
    { ticker: "D", name: "Dominion" },
    { ticker: "EXC", name: "Exelon" },
  ],
  XLC: [
    { ticker: "META", name: "Meta" },
    { ticker: "GOOGL", name: "Alphabet" },
    { ticker: "NFLX", name: "Netflix" },
    { ticker: "T", name: "AT&T" },
    { ticker: "TMUS", name: "T-Mobile" },
    { ticker: "DIS", name: "Disney" },
    { ticker: "CMCSA", name: "Comcast" },
    { ticker: "VZ", name: "Verizon" },
  ],
};

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


export const POPULAR_STOCKS = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "GOOGL", name: "Alphabet" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "META", name: "Meta" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "JPM", name: "JPMorgan" },
  { ticker: "V", name: "Visa" },
  { ticker: "BAC", name: "BofA" },
];

export async function fetchVixData(): Promise<TickerQuote | null> {
  const cacheKey = "mkt_VIX";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const tdKey = getProviderKey("twelvedata") || "demo";
    const quote = await fetchTwelveDataQuote("VIX", "CBOE VIX", tdKey);
    setCache(cacheKey, quote);
    return quote;
  } catch {
    return null;
  }
}

export async function fetchSparklineData(ticker: string): Promise<number[]> {
  const cacheKey = `spark_${ticker}`;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch {}

  const finnhubKey = getProviderKey("finnhub");
  if (!finnhubKey) return [];

  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 30 * 86400;
    const url = `${FINNHUB}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${finnhubKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.s !== "ok" || !data.c) return [];
    const closes: number[] = data.c;
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ data: closes, ts: Date.now() })
      );
    } catch {}
    return closes;
  } catch {
    return [];
  }
}

export async function searchSymbols(
  query: string
): Promise<{ symbol: string; description: string }[]> {
  if (!query.trim()) return [];

  const finnhubKey = getProviderKey("finnhub");
  if (finnhubKey) {
    try {
      const url = `${FINNHUB}/search?q=${encodeURIComponent(query)}&token=${finnhubKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        if (data.result?.length) {
          return data.result
            .filter((r: { symbol: string }) => !r.symbol.includes("."))
            .slice(0, 6)
            .map((r: { symbol: string; description: string }) => ({
              symbol: r.symbol,
              description: r.description,
            }));
        }
      }
    } catch {}
  }

  try {
    const tdKey = getProviderKey("twelvedata") || "demo";
    const url = `${TWELVE_DATA}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${tdKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data?.length) return [];
    return data.data
      .filter(
        (r: { instrument_type: string }) =>
          r.instrument_type === "Common Stock"
      )
      .slice(0, 6)
      .map((r: { symbol: string; instrument_name: string }) => ({
        symbol: r.symbol,
        description: r.instrument_name,
      }));
  } catch {
    return [];
  }
}

export function getWatchlist(): string[] {
  try {
    const raw = localStorage.getItem("watchlist");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToWatchlist(ticker: string) {
  const list = getWatchlist();
  const t = ticker.toUpperCase().trim();
  if (t && !list.includes(t)) {
    list.push(t);
    try {
      localStorage.setItem("watchlist", JSON.stringify(list));
    } catch {}
  }
}

export function removeFromWatchlist(ticker: string) {
  const list = getWatchlist().filter((t) => t !== ticker.toUpperCase());
  try {
    localStorage.setItem("watchlist", JSON.stringify(list));
  } catch {}
}

export interface AnalystRating {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export async function fetchAnalystRatings(
  ticker: string
): Promise<AnalystRating | null> {
  const finnhubKey = getProviderKey("finnhub");
  if (!finnhubKey) return null;
  try {
    const url = `${FINNHUB}/stock/recommendation?symbol=${ticker}&token=${finnhubKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const latest = data[0];
    return {
      buy: latest.buy || 0,
      hold: latest.hold || 0,
      sell: latest.sell || 0,
      strongBuy: latest.strongBuy || 0,
      strongSell: latest.strongSell || 0,
      period: latest.period || "",
    };
  } catch {
    return null;
  }
}

export interface InsiderTrade {
  name: string;
  share: number;
  change: number;
  transactionDate: string;
  transactionCode: string;
}

export async function fetchInsiderTrades(
  ticker: string
): Promise<InsiderTrade[]> {
  const finnhubKey = getProviderKey("finnhub");
  if (!finnhubKey) return [];
  try {
    const url = `${FINNHUB}/stock/insider-transactions?symbol=${ticker}&token=${finnhubKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data?.length) return [];
    return data.data
      .filter(
        (t: { transactionCode: string }) =>
          t.transactionCode === "P" || t.transactionCode === "S"
      )
      .slice(0, 10)
      .map(
        (t: {
          name: string;
          share: number;
          change: number;
          transactionDate: string;
          transactionCode: string;
        }) => ({
          name: t.name,
          share: t.share,
          change: t.change,
          transactionDate: t.transactionDate,
          transactionCode: t.transactionCode,
        })
      );
  } catch {
    return [];
  }
}

export interface StockMetrics {
  pe: number | null;
  eps: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  dividendYield: number | null;
  beta: number | null;
  revenueGrowth: number | null;
}

export async function fetchStockMetrics(
  ticker: string
): Promise<StockMetrics | null> {
  const finnhubKey = getProviderKey("finnhub");
  if (!finnhubKey) return null;
  try {
    const url = `${FINNHUB}/stock/metric?symbol=${ticker}&metric=all&token=${finnhubKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const m = data.metric;
    if (!m) return null;
    return {
      pe: m.peNormalizedAnnual ?? m.peTTM ?? null,
      eps: m.epsNormalizedAnnual ?? m.epsTTM ?? null,
      marketCap: m.marketCapitalization ?? null,
      week52High: m["52WeekHigh"] ?? null,
      week52Low: m["52WeekLow"] ?? null,
      dividendYield: m.dividendYieldIndicatedAnnual ?? null,
      beta: m.beta ?? null,
      revenueGrowth: m.revenueGrowthQuarterlyYoy ?? null,
    };
  } catch {
    return null;
  }
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
