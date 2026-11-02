import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchSymbols,
  fetchTickerQuoteWithRetry,
  addToWatchlist,
  type TickerQuote,
} from "../services/marketOverview";
import TickerDetail from "./TickerDetail";

export default function TickerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { symbol: string; description: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TickerQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const res = await searchSymbols(q);
    setResults(res);
    setSearching(false);
    setShowDropdown(true);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    timer.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer.current);
  }, [query, doSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSelect(symbol: string, description: string) {
    setShowDropdown(false);
    setQuery(symbol);
    setLoadingQuote(true);
    setAdded(false);
    try {
      const q = await fetchTickerQuoteWithRetry(symbol, description);
      setSelected(q);
    } catch {
      setSelected(null);
    }
    setLoadingQuote(false);
  }

  function handleAddToWatchlist() {
    if (selected) {
      addToWatchlist(selected.ticker);
      setAdded(true);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 bg-t-panel border border-t-border rounded px-3 py-2">
        <span className="text-t-accent text-xs font-bold">{">"}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="SEARCH TICKER..."
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-t-muted/50"
        />
        {searching && (
          <span className="text-[10px] text-t-muted animate-pulse">
            SEARCHING...
          </span>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-t-panel border border-t-border rounded overflow-hidden">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r.symbol, r.description)}
              className="w-full text-left px-3 py-2 hover:bg-t-input flex items-center justify-between border-b border-t-border last:border-0"
            >
              <span className="text-xs font-bold text-t-accent">
                {r.symbol}
              </span>
              <span className="text-[10px] text-t-muted truncate ml-3">
                {r.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {loadingQuote && (
        <div className="mt-2 bg-t-panel border border-t-border rounded p-3">
          <div className="h-12 bg-t-input rounded animate-pulse" />
        </div>
      )}

      {selected && !loadingQuote && (
        <>
          <div className="mt-2 bg-t-panel border border-t-border rounded p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-t-accent">
                    {selected.ticker}
                  </span>
                  <span className="text-xs text-t-muted">{selected.name}</span>
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-xl font-bold">
                    $
                    {selected.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    className={`text-sm font-semibold ${selected.change >= 0 ? "text-t-green" : "text-t-red"}`}
                  >
                    {selected.change >= 0 ? "+" : ""}
                    {selected.change.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      selected.changePct >= 0
                        ? "bg-t-green-bg text-t-green"
                        : "bg-t-red-bg text-t-red"
                    }`}
                  >
                    {selected.changePct >= 0 ? "+" : ""}
                    {selected.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>
              <button
                onClick={handleAddToWatchlist}
                disabled={added}
                className="text-[10px] text-t-muted hover:text-t-accent border border-t-border hover:border-t-accent px-2 py-1 rounded tracking-wider uppercase disabled:opacity-50"
              >
                {added ? "ADDED" : "+ WATCH"}
              </button>
            </div>
          </div>
          <TickerDetail ticker={selected.ticker} />
        </>
      )}
    </div>
  );
}
