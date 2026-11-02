import type { Holding } from "../../types";

interface Props {
  holding: Holding;
  onDelete: (id: number) => void;
}

export default function HoldingCard({ holding, onDelete }: Props) {
  const isPositive = (holding.gain_loss_pct ?? 0) >= 0;

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-bold text-t-accent">{holding.ticker}</h3>
          <p className="text-xs text-t-muted">
            {holding.shares} shares @ ${holding.buy_price.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => onDelete(holding.id)}
          className="text-t-red hover:text-red-400 text-xs"
        >
          DEL
        </button>
      </div>
      <div className="flex justify-between items-end mt-1">
        <div>
          <p className="text-[10px] text-t-muted tracking-wider uppercase">
            Current
          </p>
          <p className="text-lg font-semibold">
            {holding.current_price
              ? `$${holding.current_price.toFixed(2)}`
              : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-t-muted tracking-wider uppercase">
            P&L
          </p>
          <p
            className={`text-base font-bold ${isPositive ? "text-t-green" : "text-t-red"}`}
          >
            {holding.gain_loss_pct !== null
              ? `${isPositive ? "+" : ""}${holding.gain_loss_pct.toFixed(2)}%`
              : "—"}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-t-muted mt-1">
        BOUGHT {holding.buy_date}
      </p>
    </div>
  );
}
