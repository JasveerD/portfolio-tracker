import type { Trade } from "../types";

interface Props {
  trades: Trade[];
}

export default function TradeLog({ trades }: Props) {
  if (trades.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <h3 className="text-lg font-bold mb-2">Trade Log</h3>
        <p className="text-gray-500">No trades executed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 overflow-x-auto">
      <h3 className="text-lg font-bold mb-4">Trade Log</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            <th className="pb-2 pr-4">Entry Date</th>
            <th className="pb-2 pr-4">Exit Date</th>
            <th className="pb-2 pr-4 text-right">Entry $</th>
            <th className="pb-2 pr-4 text-right">Exit $</th>
            <th className="pb-2 pr-4 text-right">P&L</th>
            <th className="pb-2 pr-4 text-right">P&L %</th>
            <th className="pb-2 text-right">Days</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr
              key={i}
              className="border-b dark:border-gray-700 last:border-0"
            >
              <td className="py-2 pr-4">{t.entry_date}</td>
              <td className="py-2 pr-4">{t.exit_date}</td>
              <td className="py-2 pr-4 text-right">
                ${t.entry_price.toFixed(2)}
              </td>
              <td className="py-2 pr-4 text-right">
                ${t.exit_price.toFixed(2)}
              </td>
              <td
                className={`py-2 pr-4 text-right font-medium ${t.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                ${t.pnl.toFixed(2)}
              </td>
              <td
                className={`py-2 pr-4 text-right ${t.pnl_pct >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {t.pnl_pct.toFixed(2)}%
              </td>
              <td className="py-2 text-right">{t.holding_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
