import { useEffect, useState } from "react";
import { api } from "../api/client";
import AllocationChart from "../components/AllocationChart";
import type { PortfolioSummary } from "../types";

export default function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getPortfolioSummary()
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-red-500 p-4">{error}</p>;
  }
  if (!summary) {
    return <p className="text-gray-500 p-4">Loading...</p>;
  }

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
            ${summary.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
          <p className="text-3xl font-bold mt-1">
            ${summary.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total P&L
          </p>
          <p className={`text-3xl font-bold mt-1 ${pnlColor}`}>
            {summary.total_pnl >= 0 ? "+" : ""}
            ${summary.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
