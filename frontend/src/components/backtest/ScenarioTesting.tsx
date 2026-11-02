import { useState } from "react";

interface Scenario {
  name: string;
  description: string;
  marketMove: number;
  sectorImpacts: Record<string, number>;
}

const SCENARIOS: Scenario[] = [
  {
    name: "Rate Hike +100bp",
    description: "Fed raises rates by 1%",
    marketMove: -5,
    sectorImpacts: {
      XLK: -7,
      XLF: 3,
      XLE: -2,
      XLV: -3,
      XLY: -8,
      XLP: -1,
      XLI: -4,
      XLB: -3,
      XLRE: -10,
      XLU: -6,
      XLC: -6,
    },
  },
  {
    name: "Recession",
    description: "GDP contracts 2 quarters",
    marketMove: -20,
    sectorImpacts: {
      XLK: -25,
      XLF: -30,
      XLE: -15,
      XLV: -10,
      XLY: -35,
      XLP: -5,
      XLI: -25,
      XLB: -20,
      XLRE: -15,
      XLU: -8,
      XLC: -20,
    },
  },
  {
    name: "Oil Shock +50%",
    description: "Oil prices surge 50%",
    marketMove: -8,
    sectorImpacts: {
      XLK: -5,
      XLF: -3,
      XLE: 25,
      XLV: -4,
      XLY: -12,
      XLP: -6,
      XLI: -8,
      XLB: 5,
      XLRE: -3,
      XLU: -2,
      XLC: -4,
    },
  },
  {
    name: "Tech Bubble Burst",
    description: "Tech multiples compress 40%",
    marketMove: -15,
    sectorImpacts: {
      XLK: -40,
      XLF: -5,
      XLE: 2,
      XLV: -3,
      XLY: -20,
      XLP: 0,
      XLI: -5,
      XLB: -2,
      XLRE: -3,
      XLU: 2,
      XLC: -35,
    },
  },
  {
    name: "Bull Run +20%",
    description: "Strong market rally",
    marketMove: 20,
    sectorImpacts: {
      XLK: 28,
      XLF: 22,
      XLE: 15,
      XLV: 12,
      XLY: 30,
      XLP: 8,
      XLI: 20,
      XLB: 18,
      XLRE: 15,
      XLU: 6,
      XLC: 25,
    },
  },
];

const SECTOR_NAMES: Record<string, string> = {
  XLK: "Tech",
  XLF: "Finance",
  XLE: "Energy",
  XLV: "Health",
  XLY: "Cons Disc",
  XLP: "Cons Stpl",
  XLI: "Industrial",
  XLB: "Materials",
  XLRE: "Real Est",
  XLU: "Utilities",
  XLC: "Comms",
};

interface Props {
  holdings?: { ticker: string; shares: number; price: number }[];
}

export default function ScenarioTesting({ holdings = [] }: Props) {
  const [selected, setSelected] = useState<number>(0);
  const scenario = SCENARIOS[selected];

  const totalValue = holdings.reduce((a, h) => a + h.shares * h.price, 0);

  return (
    <div className="bg-t-panel border border-t-border rounded p-4 space-y-3">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
        Scenario / Stress Testing
      </h3>

      <div className="flex flex-wrap gap-1">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setSelected(i)}
            className={`text-[9px] px-2 py-1 rounded border transition-colors ${
              selected === i
                ? "border-t-accent bg-t-accent-bg text-t-accent"
                : "border-t-border text-t-muted hover:text-t-text hover:border-t-muted"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="bg-t-bg border border-t-border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-bold text-t-accent">{scenario.name}</p>
            <p className="text-[10px] text-t-muted">{scenario.description}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-t-muted">Market Impact</p>
            <p
              className={`text-sm font-bold ${
                scenario.marketMove >= 0 ? "text-t-green" : "text-t-red"
              }`}
            >
              {scenario.marketMove >= 0 ? "+" : ""}
              {scenario.marketMove}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 mt-3">
          {Object.entries(scenario.sectorImpacts).map(([sector, impact]) => (
            <div
              key={sector}
              className={`rounded px-2 py-1.5 text-center ${
                impact >= 5
                  ? "bg-green-600/30 text-t-green"
                  : impact >= 0
                  ? "bg-t-green-bg text-t-green"
                  : impact >= -10
                  ? "bg-t-red-bg text-t-red"
                  : "bg-red-600/30 text-t-red"
              }`}
            >
              <p className="text-[8px] font-medium opacity-70">
                {SECTOR_NAMES[sector] || sector}
              </p>
              <p className="text-[11px] font-bold">
                {impact >= 0 ? "+" : ""}
                {impact}%
              </p>
            </div>
          ))}
        </div>

        {holdings.length > 0 && totalValue > 0 && (
          <div className="mt-3 pt-3 border-t border-t-border">
            <p className="text-[9px] text-t-muted mb-1.5 tracking-wider uppercase">
              Estimated Portfolio Impact
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold text-t-red">
                ${Math.round(totalValue * (scenario.marketMove / 100)).toLocaleString()}
              </span>
              <span className="text-[10px] text-t-muted">
                on ${totalValue.toLocaleString()} portfolio
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
