import { useEffect, useRef, useState } from "react";
import {
  SECTORS,
  SECTOR_HOLDINGS,
  fetchTickerQuoteWithRetry,
  needsDelay,
  type TickerQuote,
} from "../../services/marketOverview";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  startLoading?: boolean;
  onDone?: () => void;
}

export default function SectorHeatmap({ startLoading = true, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [sectors, setSectors] = useState<TickerQuote[]>(
    SECTORS.map((s) => ({
      ...s,
      price: 0,
      change: 0,
      changePct: 0,
      loading: true,
    }))
  );
  const [loaded, setLoaded] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<
    (TickerQuote & { loading?: boolean; error?: boolean })[]
  >([]);
  const holdingsFetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!startLoading) return;
    let cancelled = false;

    async function load() {
      for (let i = 0; i < SECTORS.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            SECTORS[i].ticker,
            SECTORS[i].name
          );
          if (!cancelled) {
            setSectors((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...q, loading: false } : p
              )
            );
            setLoaded((n) => n + 1);
          }
        } catch {
          if (!cancelled) {
            setSectors((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, loading: false, error: true } : p
              )
            );
            setLoaded((n) => n + 1);
          }
        }
        if (i < SECTORS.length - 1 && !cancelled && needsDelay())
          await wait(8000);
      }
      if (!cancelled) onDoneRef.current?.();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startLoading]);

  useEffect(() => {
    if (!selected || holdingsFetchedFor.current === selected) return;
    holdingsFetchedFor.current = selected;

    const stocks = SECTOR_HOLDINGS[selected] || [];
    setHoldings(
      stocks.map((s) => ({
        ...s,
        price: 0,
        change: 0,
        changePct: 0,
        loading: true,
      }))
    );

    let cancelled = false;

    async function loadHoldings() {
      for (let i = 0; i < stocks.length; i++) {
        if (cancelled) return;
        try {
          const q = await fetchTickerQuoteWithRetry(
            stocks[i].ticker,
            stocks[i].name
          );
          if (!cancelled) {
            setHoldings((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...q, loading: false } : p
              )
            );
          }
        } catch {
          if (!cancelled) {
            setHoldings((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, loading: false, error: true } : p
              )
            );
          }
        }
        if (i < stocks.length - 1 && !cancelled && needsDelay())
          await wait(8000);
      }
    }

    loadHoldings();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  function handleClick(ticker: string) {
    if (selected === ticker) {
      setSelected(null);
      holdingsFetchedFor.current = null;
    } else {
      setSelected(ticker);
      holdingsFetchedFor.current = null;
    }
  }

  function getBg(pct: number): string {
    if (pct >= 2) return "bg-green-700 text-green-100";
    if (pct >= 1) return "bg-green-600/80 text-green-100";
    if (pct >= 0.5) return "bg-green-600/50 text-green-200";
    if (pct >= 0) return "bg-t-green-bg text-t-green";
    if (pct >= -0.5) return "bg-t-red-bg text-t-red";
    if (pct >= -1) return "bg-red-600/50 text-red-200";
    if (pct >= -2) return "bg-red-600/80 text-red-100";
    return "bg-red-700 text-red-100";
  }

  const selectedSector = sectors.find((s) => s.ticker === selected);

  return (
    <div className="bg-t-panel border border-t-border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Sector Performance
        </h3>
        {loaded < SECTORS.length && (
          <span className="text-[10px] text-t-muted">
            {startLoading
              ? `Loading ${loaded}/${SECTORS.length}...`
              : "Waiting..."}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {sectors.map((s) => (
          <button
            key={s.ticker}
            onClick={() => !s.loading && !s.error && handleClick(s.ticker)}
            className={`rounded p-2.5 text-center transition-colors ${
              s.loading
                ? "bg-t-input cursor-wait"
                : s.error
                ? "bg-t-input cursor-default"
                : getBg(s.changePct)
            } ${
              selected === s.ticker
                ? "ring-2 ring-t-accent ring-offset-1 ring-offset-t-panel"
                : "hover:ring-1 hover:ring-t-muted/30"
            }`}
          >
            <p
              className={`text-[10px] font-medium ${
                s.loading || s.error ? "text-t-muted" : ""
              }`}
            >
              {s.name}
            </p>
            {s.loading ? (
              <div className="h-4 mt-1 bg-t-border rounded animate-pulse mx-auto w-10" />
            ) : s.error ? (
              <p className="text-[10px] text-t-red mt-1">--</p>
            ) : (
              <p className="text-xs font-bold mt-0.5">
                {s.changePct >= 0 ? "+" : ""}
                {s.changePct.toFixed(2)}%
              </p>
            )}
            <p className="text-[9px] mt-0.5 opacity-60">{s.ticker}</p>
          </button>
        ))}
      </div>

      {selected && selectedSector && (
        <div className="mt-3 border-t border-t-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-t-accent">
                {selectedSector.name}
              </span>
              <span className="text-[10px] text-t-muted">
                Top Holdings
              </span>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                holdingsFetchedFor.current = null;
              }}
              className="text-[10px] text-t-muted hover:text-t-red"
            >
              CLOSE
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {holdings.map((h) => (
              <div
                key={h.ticker}
                className="bg-t-bg border border-t-border rounded px-2 py-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-t-accent">
                    {h.ticker}
                  </span>
                  {!h.loading && !h.error && (
                    <span
                      className={`text-[9px] font-semibold ${
                        h.changePct >= 0 ? "text-t-green" : "text-t-red"
                      }`}
                    >
                      {h.changePct >= 0 ? "+" : ""}
                      {h.changePct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-t-muted truncate">{h.name}</p>
                {h.loading ? (
                  <div className="h-3 mt-0.5 bg-t-input rounded animate-pulse w-12" />
                ) : h.error ? (
                  <p className="text-[9px] text-t-red">--</p>
                ) : (
                  <p className="text-[11px] font-bold mt-0.5">
                    ${h.price.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
