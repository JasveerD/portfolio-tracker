import { useEffect, useState } from "react";
import { fetchVixData, type TickerQuote } from "../services/marketOverview";

function getZone(val: number): { label: string; color: string } {
  if (val < 15) return { label: "LOW", color: "#3fb950" };
  if (val < 20) return { label: "NORMAL", color: "#f0a030" };
  if (val < 25) return { label: "ELEVATED", color: "#e3742f" };
  if (val < 30) return { label: "HIGH", color: "#f85149" };
  return { label: "EXTREME", color: "#da3633" };
}

export default function VixGauge() {
  const [vix, setVix] = useState<TickerQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVixData()
      .then((data) => {
        setVix(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cx = 80;
  const cy = 78;
  const r = 58;
  const minVal = 10;
  const maxVal = 45;

  function arcPath(startPct: number, endPct: number): string {
    const startAngle = Math.PI * (1 - startPct);
    const endAngle = Math.PI * (1 - endPct);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy - r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy - r * Math.sin(endAngle);
    const sweep = endPct > startPct ? 0 : 1;
    return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
  }

  const clampedVal = vix
    ? Math.max(minVal, Math.min(maxVal, vix.price))
    : minVal;
  const pct = (clampedVal - minVal) / (maxVal - minVal);
  const needleAngle = Math.PI * (1 - pct);
  const nx = cx + (r - 10) * Math.cos(needleAngle);
  const ny = cy - (r - 10) * Math.sin(needleAngle);
  const zone = vix ? getZone(vix.price) : null;

  return (
    <div className="bg-t-panel border border-t-border rounded p-3 flex flex-col items-center">
      <p className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-1 self-start">
        VIX
      </p>
      {loading ? (
        <div className="h-24 w-full bg-t-input rounded animate-pulse" />
      ) : !vix ? (
        <p className="text-[10px] text-t-muted py-6">NO DATA</p>
      ) : (
        <>
          <svg viewBox="0 0 160 92" className="w-full max-w-[160px]">
            <path
              d={arcPath(0, 0.29)}
              stroke="#3fb950"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d={arcPath(0.29, 0.57)}
              stroke="#f0a030"
              strokeWidth="7"
              fill="none"
              opacity="0.7"
            />
            <path
              d={arcPath(0.57, 0.79)}
              stroke="#f85149"
              strokeWidth="7"
              fill="none"
              opacity="0.7"
            />
            <path
              d={arcPath(0.79, 1)}
              stroke="#da3633"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />

            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke="#e6edf3"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="3" fill="#e6edf3" />

            <text
              x={cx}
              y={cy - 18}
              textAnchor="middle"
              fill="#e6edf3"
              fontSize="20"
              fontWeight="bold"
              fontFamily="'JetBrains Mono', monospace"
            >
              {vix.price.toFixed(1)}
            </text>
          </svg>
          <div className="flex items-center gap-2 -mt-1">
            <span
              className="text-[10px] font-bold tracking-wider"
              style={{ color: zone!.color }}
            >
              {zone!.label}
            </span>
            <span
              className={`text-[10px] ${vix.change >= 0 ? "text-t-red" : "text-t-green"}`}
            >
              {vix.change >= 0 ? "+" : ""}
              {vix.changePct.toFixed(1)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
