import { useEffect, useState } from "react";
import AllocationChart from "../components/AllocationChart";
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

  if (loading) return <p className="text-gray-500 p-4">Loading...</p>;
  if (!summary) return <p className="text-gray-500 p-4">No data</p>;

  const pnlColor = summary.total_pnl >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Portfolio Value
          </p>
          <p className="text-3xl font-bold mt-1">
            $
            {summary.total_value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Cost
          </p>
          <p className="text-3xl font-bold mt-1">
            $
            {summary.total_cost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
          <p className={`text-3xl font-bold mt-1 ${pnlColor}`}>
            {summary.total_pnl >= 0 ? "+" : ""}$
            {summary.total_pnl.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
            <span className="text-lg ml-2">
              ({summary.total_pnl_pct.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      <AllocationChart data={summary.allocations} />
    </div>
  );
}
