import { useEffect, useState } from "react";
import {
  fetchAnalystRatings,
  fetchInsiderTrades,
  fetchStockMetrics,
  fetchSparklineData,
  getProviderKey,
  type AnalystRating,
  type InsiderTrade,
  type StockMetrics,
} from "../services/marketOverview";
import RelativeStrength from "./RelativeStrength";
import RollingPerformance from "./RollingPerformance";
import SeasonalityHeatmap from "./SeasonalityHeatmap";
import TechnicalChart from "./TechnicalChart";

interface Props {
  ticker: string;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "--";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e3).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${n.toFixed(1)}M`;
  return n.toFixed(2);
}

export default function TickerDetail({ ticker }: Props) {
  const [ratings, setRatings] = useState<AnalystRating | null>(null);
  const [insiders, setInsiders] = useState<InsiderTrade[]>([]);
  const [metrics, setMetrics] = useState<StockMetrics | null>(null);
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "technicals" | "rolling" | "relative" | "seasonality" | "insiders">("overview");
  const hasFinnhub = !!getProviderKey("finnhub");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRatings(null);
    setInsiders([]);
    setMetrics(null);
    setSparkline([]);
    setTab("overview");

    Promise.allSettled([
      fetchAnalystRatings(ticker),
      fetchInsiderTrades(ticker),
      fetchStockMetrics(ticker),
      fetchSparklineData(ticker),
    ]).then((results) => {
      if (cancelled) return;
      if (results[0].status === "fulfilled") setRatings(results[0].value);
      if (results[1].status === "fulfilled") setInsiders(results[1].value);
      if (results[2].status === "fulfilled") setMetrics(results[2].value);
      if (results[3].status === "fulfilled") setSparkline(results[3].value);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="mt-2 bg-t-panel border border-t-border rounded p-3 space-y-2">
        <div className="h-4 bg-t-input rounded animate-pulse w-32" />
        <div className="h-20 bg-t-input rounded animate-pulse" />
      </div>
    );
  }

  const hasData = ratings || metrics || insiders.length > 0 || sparkline.length > 0;
  if (!hasData) return null;

  const ratingTotal = ratings
    ? ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell
    : 0;

  const sparkMin = Math.min(...sparkline);
  const sparkMax = Math.max(...sparkline);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkW = 200;
  const sparkH = 40;
  const sparkPoints = sparkline
    .map(
      (v, i) =>
        `${(i / (sparkline.length - 1)) * sparkW},${sparkH - ((v - sparkMin) / sparkRange) * sparkH}`
    )
    .join(" ");
  const sparkUp = sparkline.length > 1 && sparkline[sparkline.length - 1] >= sparkline[0];

  return (
    <div className="mt-2 bg-t-panel border border-t-border rounded p-3 space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTab("overview")}
          className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
            tab === "overview"
              ? "bg-t-accent-bg text-t-accent"
              : "text-t-muted hover:text-t-text"
          }`}
        >
          Overview
        </button>
        {hasFinnhub && (
          <button
            onClick={() => setTab("technicals")}
            className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
              tab === "technicals"
                ? "bg-t-accent-bg text-t-accent"
                : "text-t-muted hover:text-t-text"
            }`}
          >
            Technicals
          </button>
        )}
        {hasFinnhub && (
          <button
            onClick={() => setTab("rolling")}
            className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
              tab === "rolling"
                ? "bg-t-accent-bg text-t-accent"
                : "text-t-muted hover:text-t-text"
            }`}
          >
            Rolling
          </button>
        )}
        {hasFinnhub && (
          <button
            onClick={() => setTab("relative")}
            className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
              tab === "relative"
                ? "bg-t-accent-bg text-t-accent"
                : "text-t-muted hover:text-t-text"
            }`}
          >
            Rel Str
          </button>
        )}
        {hasFinnhub && (
          <button
            onClick={() => setTab("seasonality")}
            className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
              tab === "seasonality"
                ? "bg-t-accent-bg text-t-accent"
                : "text-t-muted hover:text-t-text"
            }`}
          >
            Seasonal
          </button>
        )}
        {insiders.length > 0 && (
          <button
            onClick={() => setTab("insiders")}
            className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
              tab === "insiders"
                ? "bg-t-accent-bg text-t-accent"
                : "text-t-muted hover:text-t-text"
            }`}
          >
            Insiders ({insiders.length})
          </button>
        )}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          {sparkline.length > 1 && (
            <div>
              <p className="text-[9px] text-t-muted mb-1 tracking-wider uppercase">
                30-Day Price
              </p>
              <svg
                viewBox={`0 0 ${sparkW} ${sparkH}`}
                className="w-full h-10"
                preserveAspectRatio="none"
              >
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke={sparkUp ? "#22c55e" : "#ef4444"}
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          )}

          {metrics && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "P/E", value: metrics.pe?.toFixed(1) ?? "--" },
                { label: "EPS", value: metrics.eps ? `$${metrics.eps.toFixed(2)}` : "--" },
                {
                  label: "Mkt Cap",
                  value: metrics.marketCap ? fmt(metrics.marketCap) : "--",
                },
                {
                  label: "Beta",
                  value: metrics.beta?.toFixed(2) ?? "--",
                },
                {
                  label: "52W High",
                  value: metrics.week52High ? `$${metrics.week52High.toFixed(2)}` : "--",
                },
                {
                  label: "52W Low",
                  value: metrics.week52Low ? `$${metrics.week52Low.toFixed(2)}` : "--",
                },
                {
                  label: "Div Yield",
                  value: metrics.dividendYield
                    ? `${metrics.dividendYield.toFixed(2)}%`
                    : "--",
                },
                {
                  label: "Rev Growth",
                  value: metrics.revenueGrowth
                    ? `${metrics.revenueGrowth.toFixed(1)}%`
                    : "--",
                },
              ].map((m) => (
                <div key={m.label} className="bg-t-bg border border-t-border rounded px-2 py-1.5">
                  <p className="text-[9px] text-t-muted">{m.label}</p>
                  <p className="text-xs font-bold">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {ratings && ratingTotal > 0 && (
            <div>
              <p className="text-[9px] text-t-muted mb-1.5 tracking-wider uppercase">
                Analyst Consensus
                {ratings.period && (
                  <span className="ml-2 text-t-muted/50">{ratings.period}</span>
                )}
              </p>
              <div className="flex h-4 rounded overflow-hidden text-[8px] font-bold">
                {ratings.strongBuy > 0 && (
                  <div
                    className="bg-green-600 flex items-center justify-center text-white"
                    style={{ width: `${(ratings.strongBuy / ratingTotal) * 100}%` }}
                  >
                    {ratings.strongBuy}
                  </div>
                )}
                {ratings.buy > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-white"
                    style={{ width: `${(ratings.buy / ratingTotal) * 100}%` }}
                  >
                    {ratings.buy}
                  </div>
                )}
                {ratings.hold > 0 && (
                  <div
                    className="bg-yellow-500 flex items-center justify-center text-black"
                    style={{ width: `${(ratings.hold / ratingTotal) * 100}%` }}
                  >
                    {ratings.hold}
                  </div>
                )}
                {ratings.sell > 0 && (
                  <div
                    className="bg-red-500 flex items-center justify-center text-white"
                    style={{ width: `${(ratings.sell / ratingTotal) * 100}%` }}
                  >
                    {ratings.sell}
                  </div>
                )}
                {ratings.strongSell > 0 && (
                  <div
                    className="bg-red-700 flex items-center justify-center text-white"
                    style={{ width: `${(ratings.strongSell / ratingTotal) * 100}%` }}
                  >
                    {ratings.strongSell}
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-1 text-[8px] text-t-muted">
                <span>Strong Buy</span>
                <span>Buy</span>
                <span>Hold</span>
                <span>Sell</span>
                <span>Strong Sell</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "technicals" && <TechnicalChart ticker={ticker} />}

      {tab === "rolling" && <RollingPerformance ticker={ticker} />}

      {tab === "relative" && <RelativeStrength ticker={ticker} />}

      {tab === "seasonality" && <SeasonalityHeatmap ticker={ticker} />}

      {tab === "insiders" && insiders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-t-muted border-b border-t-border">
                <th className="text-left py-1 pr-2">Name</th>
                <th className="text-left py-1 pr-2">Type</th>
                <th className="text-right py-1 pr-2">Shares</th>
                <th className="text-right py-1">Date</th>
              </tr>
            </thead>
            <tbody>
              {insiders.map((t, i) => (
                <tr key={i} className="border-b border-t-border/50">
                  <td className="py-1 pr-2 truncate max-w-[120px]">{t.name}</td>
                  <td className="py-1 pr-2">
                    <span
                      className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                        t.transactionCode === "P"
                          ? "bg-t-green-bg text-t-green"
                          : "bg-t-red-bg text-t-red"
                      }`}
                    >
                      {t.transactionCode === "P" ? "BUY" : "SELL"}
                    </span>
                  </td>
                  <td className="py-1 pr-2 text-right font-medium">
                    {Math.abs(t.change).toLocaleString()}
                  </td>
                  <td className="py-1 text-right text-t-muted">
                    {t.transactionDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
