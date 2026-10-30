import type { PricePoint } from "../types";

const TWELVE_DATA = "https://api.twelvedata.com";
const TWELVE_KEY = "demo";
const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/";
const ALLORIGINS = "https://api.allorigins.win/get?url=";

interface TwelveDataResponse {
  status: string;
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

interface YahooChartResponse {
  chart: {
    result: {
      timestamp: number[];
      indicators: {
        quote: {
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }[];
      };
    }[];
    error: { code: string; description: string } | null;
  };
}

function parseTwelveData(data: TwelveDataResponse, ticker: string): PricePoint[] {
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

async function fetchTwelveData(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<PricePoint[]> {
  const url = `${TWELVE_DATA}/time_series?symbol=${ticker.toUpperCase()}&interval=1day&start_date=${startDate}&end_date=${endDate}&apikey=${TWELVE_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Twelve Data returned ${res.status}`);
  const data: TwelveDataResponse = await res.json();
  return parseTwelveData(data, ticker);
}

async function fetchTwelveDataRecent(
  ticker: string,
  count: number
): Promise<PricePoint[]> {
  const url = `${TWELVE_DATA}/time_series?symbol=${ticker.toUpperCase()}&interval=1day&outputsize=${count}&apikey=${TWELVE_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Twelve Data returned ${res.status}`);
  const data: TwelveDataResponse = await res.json();
  return parseTwelveData(data, ticker);
}

async function fetchYahooViaProxy(url: string): Promise<YahooChartResponse> {
  const proxyUrl = `${ALLORIGINS}${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
  const wrapper = await res.json();
  if (!wrapper.contents) throw new Error("Empty response from proxy");
  return JSON.parse(wrapper.contents);
}

function parseYahooResponse(data: YahooChartResponse, ticker: string): PricePoint[] {
  if (data.chart.error) throw new Error(data.chart.error.description);
  if (!data.chart.result?.length) throw new Error(`No data for ${ticker}`);

  const result = data.chart.result[0];
  const { timestamp, indicators } = result;
  const quote = indicators.quote[0];

  const points: PricePoint[] = [];
  for (let i = 0; i < timestamp.length; i++) {
    if (quote.close[i] == null) continue;
    points.push({
      date: new Date(timestamp[i] * 1000).toISOString().slice(0, 10),
      open: quote.open[i] ?? 0,
      high: quote.high[i] ?? 0,
      low: quote.low[i] ?? 0,
      close: quote.close[i],
      volume: quote.volume[i] ?? 0,
    });
  }
  return points;
}

export async function fetchPriceHistory(
  ticker: string,
  period1: string,
  period2: string
): Promise<PricePoint[]> {
  try {
    return await fetchTwelveData(ticker, period1, period2);
  } catch {
    // Fallback: Yahoo via allorigins proxy
  }

  const p1 = Math.floor(new Date(period1).getTime() / 1000);
  const p2 = Math.floor(new Date(period2).getTime() / 1000);
  const url = `${YAHOO_CHART}${ticker.toUpperCase()}?period1=${p1}&period2=${p2}&interval=1d`;
  const data = await fetchYahooViaProxy(url);
  return parseYahooResponse(data, ticker);
}

export async function fetchCurrentPrice(
  ticker: string
): Promise<number | null> {
  try {
    const points = await fetchTwelveDataRecent(ticker, 5);
    if (points.length > 0) return points[points.length - 1].close;
  } catch {
    // Fallback below
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const fiveDaysAgo = now - 5 * 86400;
    const url = `${YAHOO_CHART}${ticker.toUpperCase()}?period1=${fiveDaysAgo}&period2=${now}&interval=1d`;
    const data = await fetchYahooViaProxy(url);
    if (!data.chart.result?.length) return null;
    const quote = data.chart.result[0].indicators.quote[0];
    const closes = quote.close.filter((c) => c != null);
    return closes.length > 0 ? closes[closes.length - 1] : null;
  } catch {
    return null;
  }
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
