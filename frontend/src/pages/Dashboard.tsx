import { useEffect, useState } from "react";
import AllocationChart from "../components/portfolio/AllocationChart";
import { fetchCurrentPrice } from "../services/marketData";
import { getHoldings } from "../services/storage";

interface Summary {
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_pct: number;
  allocations: { ticker: string; value: number }[];
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const holdings = getHoldings();
      let totalValue = 0;
      let totalCost = 0;
      const allocations: { ticker: string; value: number }[] = [];

      await Promise.all(
        holdings.map(async (h) => {
          const cost = h.shares * h.buy_price;
          totalCost += cost;
          const price = await fetchCurrentPrice(h.ticker);
          const value = price ? h.shares * price : cost;
          totalValue += value;
          allocations.push({
            ticker: h.ticker,
            value: Math.round(value * 100) / 100,
          });
        })
      );

      const totalPnl = totalValue - totalCost;
      const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

      setSummary({
        total_value: Math.round(totalValue * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        total_pnl: Math.round(totalPnl * 100) / 100,
        total_pnl_pct: Math.round(totalPnlPct * 100) / 100,
        allocations,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="p-3">
        <span className="text-[10px] text-t-accent animate-pulse tracking-wider">LOADING DATA...</span>
      </div>
    );
  if (!summary) return <p className="text-t-muted p-3 text-[10px]">NO DATA</p>;
  if (summary.allocations.length === 0)
    return (
      <div className="space-y-3">
        <div className="bg-t-accent px-3 py-1">
          <h2 className="text-[11px] font-bold text-black tracking-widest uppercase">
            Dashboard
          </h2>
        </div>
        <div className="border border-t-border p-3">
          <p className="text-t-muted text-[11px]">
            NO HOLDINGS. ADD POSITIONS IN <span className="text-t-accent">F2 PORT</span> TO VIEW DASHBOARD.
          </p>
        </div>
      </div>
    );

  const pnlColor =
    summary.total_pnl >= 0 ? "text-t-green" : "text-t-red";
  const pnlBg =
    summary.total_pnl >= 0 ? "bg-t-green-bg" : "bg-t-red-bg";

  return (
    <div className="space-y-3">
      <div className="bg-t-accent px-3 py-1">
        <h2 className="text-[11px] font-bold text-black tracking-widest uppercase">
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-t-border">
        <div className="bg-t-panel p-3">
          <p className="text-[9px] text-t-muted tracking-widest uppercase mb-0.5">
            Portfolio Value
          </p>
          <p className="text-xl font-bold text-t-text">
            $
            {summary.total_value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-t-panel p-3">
          <p className="text-[9px] text-t-muted tracking-widest uppercase mb-0.5">
            Total Cost
          </p>
          <p className="text-xl font-bold text-t-text">
            $
            {summary.total_cost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className={`bg-t-panel p-3 ${pnlBg}`}>
          <p className="text-[9px] text-t-muted tracking-widest uppercase mb-0.5">
            Total P&L
          </p>
          <p className={`text-xl font-bold ${pnlColor}`}>
            {summary.total_pnl >= 0 ? "+" : ""}$
            {summary.total_pnl.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
            <span className="text-xs ml-2">
              ({summary.total_pnl_pct.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      <AllocationChart data={summary.allocations} />
    </div>
  );
}
