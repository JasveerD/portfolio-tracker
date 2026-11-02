import { useState } from "react";

export default function KellyCriterion() {
  const [winRate, setWinRate] = useState(55);
  const [winLoss, setWinLoss] = useState(1.5);

  const p = winRate / 100;
  const q = 1 - p;
  const b = winLoss;
  const kelly = b > 0 ? (p * b - q) / b : 0;
  const halfKelly = kelly / 2;
  const quarterKelly = kelly / 4;

  const ev = p * b - q;

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 space-y-3">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Kelly Criterion Calculator
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] text-t-muted tracking-wider uppercase mb-1">
            Win Rate (%)
          </label>
          <input
            type="number"
            value={winRate}
            onChange={(e) => setWinRate(Number(e.target.value))}
            min={0}
            max={100}
            step={1}
            className="w-full px-2 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
          />
          <input
            type="range"
            value={winRate}
            onChange={(e) => setWinRate(Number(e.target.value))}
            min={0}
            max={100}
            className="w-full mt-1 accent-t-accent"
          />
        </div>
        <div>
          <label className="block text-[9px] text-t-muted tracking-wider uppercase mb-1">
            Win/Loss Ratio
          </label>
          <input
            type="number"
            value={winLoss}
            onChange={(e) => setWinLoss(Number(e.target.value))}
            min={0}
            step={0.1}
            className="w-full px-2 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
          />
          <input
            type="range"
            value={winLoss}
            onChange={(e) => setWinLoss(Number(e.target.value))}
            min={0}
            max={5}
            step={0.1}
            className="w-full mt-1 accent-t-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
          <p className="text-[9px] text-t-muted">Full Kelly</p>
          <p
            className={`text-sm font-bold ${kelly > 0 ? "text-t-green" : "text-t-red"}`}
          >
            {(kelly * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
          <p className="text-[9px] text-t-muted">Half Kelly</p>
          <p className="text-sm font-bold text-t-accent">
            {(halfKelly * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
          <p className="text-[9px] text-t-muted">Quarter Kelly</p>
          <p className="text-sm font-bold">
            {(quarterKelly * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-t-bg border border-t-border rounded px-2 py-1.5">
          <p className="text-[9px] text-t-muted">Edge (EV)</p>
          <p
            className={`text-sm font-bold ${ev > 0 ? "text-t-green" : "text-t-red"}`}
          >
            {ev >= 0 ? "+" : ""}
            {(ev * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {kelly <= 0 && (
        <p className="text-[10px] text-t-red">
          Negative edge — no bet is optimal. Improve your win rate or win/loss
          ratio.
        </p>
      )}
      {kelly > 0 && (
        <p className="text-[10px] text-t-muted">
          Half Kelly is recommended for most traders — it captures 75% of the
          growth rate with much lower volatility.
        </p>
      )}
    </div>
  );
}
