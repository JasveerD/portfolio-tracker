import type { Trade } from "../../types";

interface Props {
  trades: Trade[];
}

export default function TradeLog({ trades }: Props) {
  if (trades.length === 0) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-4">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-2">
          Trade Log
        </h3>
        <p className="text-t-muted text-sm">No trades executed.</p>
      </div>
    );
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 overflow-x-auto">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-3">
        Trade Log
      </h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-t-muted border-b border-t-border">
            <th className="pb-2 pr-4 tracking-wider uppercase text-[10px]">
              Entry
            </th>
            <th className="pb-2 pr-4 tracking-wider uppercase text-[10px]">
              Exit
            </th>
            <th className="pb-2 pr-4 text-right tracking-wider uppercase text-[10px]">
              Entry $
            </th>
            <th className="pb-2 pr-4 text-right tracking-wider uppercase text-[10px]">
              Exit $
            </th>
            <th className="pb-2 pr-4 text-right tracking-wider uppercase text-[10px]">
              P&L
            </th>
            <th className="pb-2 pr-4 text-right tracking-wider uppercase text-[10px]">
              P&L %
            </th>
            <th className="pb-2 text-right tracking-wider uppercase text-[10px]">
              Days
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr
              key={i}
              className="border-b border-t-border last:border-0 hover:bg-t-input/50"
            >
              <td className="py-1.5 pr-4 text-t-muted">{t.entry_date}</td>
              <td className="py-1.5 pr-4 text-t-muted">{t.exit_date}</td>
              <td className="py-1.5 pr-4 text-right">
                ${t.entry_price.toFixed(2)}
              </td>
              <td className="py-1.5 pr-4 text-right">
                ${t.exit_price.toFixed(2)}
              </td>
              <td
                className={`py-1.5 pr-4 text-right font-medium ${t.pnl >= 0 ? "text-t-green" : "text-t-red"}`}
              >
                ${t.pnl.toFixed(2)}
              </td>
              <td
                className={`py-1.5 pr-4 text-right ${t.pnl_pct >= 0 ? "text-t-green" : "text-t-red"}`}
              >
                {t.pnl_pct.toFixed(2)}%
              </td>
              <td className="py-1.5 text-right text-t-muted">
                {t.holding_days}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
