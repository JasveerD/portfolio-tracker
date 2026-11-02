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
    return <p className="text-t-muted p-4 text-sm">Loading...</p>;
  if (!summary) return <p className="text-t-muted p-4 text-sm">No data</p>;
  if (summary.allocations.length === 0)
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-t-muted tracking-wider uppercase">
          Dashboard
        </h2>
        <p className="text-t-muted text-sm">
          No holdings yet. Add some in the PORT tab to see your dashboard.
        </p>
      </div>
    );

  const pnlColor =
    summary.total_pnl >= 0 ? "text-t-green" : "text-t-red";
  const pnlBg =
    summary.total_pnl >= 0 ? "bg-t-green-bg" : "bg-t-red-bg";

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-t-muted tracking-wider uppercase">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-t-panel border border-t-border rounded p-4">
          <p className="text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Portfolio Value
          </p>
          <p className="text-2xl font-bold">
            $
            {summary.total_value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-t-panel border border-t-border rounded p-4">
          <p className="text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Total Cost
          </p>
          <p className="text-2xl font-bold">
            $
            {summary.total_cost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className={`bg-t-panel border border-t-border rounded p-4 ${pnlBg}`}>
          <p className="text-[10px] text-t-muted tracking-wider uppercase mb-1">
            Total P&L
          </p>
          <p className={`text-2xl font-bold ${pnlColor}`}>
            {summary.total_pnl >= 0 ? "+" : ""}$
            {summary.total_pnl.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
            <span className="text-sm ml-2">
              ({summary.total_pnl_pct.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      <AllocationChart data={summary.allocations} />
    </div>
  );
}
