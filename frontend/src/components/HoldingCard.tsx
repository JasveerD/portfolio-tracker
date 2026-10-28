import type { Holding } from "../types";

interface Props {
  holding: Holding;
  onDelete: (id: number) => void;
}

export default function HoldingCard({ holding, onDelete }: Props) {
  const isPositive = (holding.gain_loss_pct ?? 0) >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">{holding.ticker}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {holding.shares} shares @ ${holding.buy_price.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => onDelete(holding.id)}
          className="text-red-400 hover:text-red-600 text-sm"
        >
          Remove
        </button>
      </div>
      <div className="flex justify-between items-end mt-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current Price
          </p>
          <p className="text-xl font-semibold">
            {holding.current_price
              ? `$${holding.current_price.toFixed(2)}`
              : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Gain/Loss</p>
          <p
            className={`text-lg font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {holding.gain_loss_pct !== null
              ? `${isPositive ? "+" : ""}${holding.gain_loss_pct.toFixed(2)}%`
              : "—"}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Bought {holding.buy_date}
      </p>
    </div>
  );
}
