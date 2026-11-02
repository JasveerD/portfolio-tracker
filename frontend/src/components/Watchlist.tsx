import { useEffect, useState } from "react";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  fetchTickerQuoteWithRetry,
  type TickerQuote,
} from "../services/marketOverview";

export default function Watchlist() {
  const [tickers, setTickers] = useState<string[]>(() => getWatchlist());
  const [quotes, setQuotes] = useState<
    Record<string, TickerQuote & { loading?: boolean; error?: boolean }>
  >({});
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      for (const t of tickers) {
        if (cancelled || quotes[t]) continue;
        setQuotes((prev) => ({
          ...prev,
          [t]: {
            ticker: t,
            name: t,
            price: 0,
            change: 0,
            changePct: 0,
            loading: true,
          },
        }));
        try {
          const q = await fetchTickerQuoteWithRetry(t, t);
          if (!cancelled) {
            setQuotes((prev) => ({
              ...prev,
              [t]: { ...q, loading: false },
            }));
          }
        } catch {
          if (!cancelled) {
            setQuotes((prev) => ({
              ...prev,
              [t]: {
                ticker: t,
                name: t,
                price: 0,
                change: 0,
                changePct: 0,
                loading: false,
                error: true,
              },
            }));
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tickers]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = input.toUpperCase().trim();
    if (!t || tickers.includes(t)) return;
    addToWatchlist(t);
    setTickers([...tickers, t]);
    setInput("");
    setShowInput(false);
  }

  function handleRemove(t: string) {
    removeFromWatchlist(t);
    setTickers(tickers.filter((x) => x !== t));
    setQuotes((prev) => {
      const next = { ...prev };
      delete next[t];
      return next;
    });
  }

  if (tickers.length === 0 && !showInput) {
    return (
      <div className="bg-t-panel border border-t-border rounded p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
            Watchlist
          </h3>
          <button
            onClick={() => setShowInput(true)}
            className="text-[10px] text-t-muted hover:text-t-accent border border-t-border hover:border-t-accent px-2 py-0.5 rounded tracking-wider"
          >
            + ADD
          </button>
        </div>
        <p className="text-xs text-t-muted mt-2">
          No tickers yet. Search for a stock and click "+ WATCH", or click "+ ADD" above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-t-panel border border-t-border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold">
          Watchlist
        </h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-[10px] text-t-muted hover:text-t-accent border border-t-border hover:border-t-accent px-2 py-0.5 rounded tracking-wider"
        >
          {showInput ? "CANCEL" : "+ ADD"}
        </button>
      </div>

      {showInput && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="TICKER"
            className="flex-1 px-3 py-1 rounded border border-t-border bg-t-input text-xs focus:outline-none focus:border-t-accent"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 bg-t-accent text-t-bg rounded text-[10px] font-medium hover:brightness-110 tracking-wide"
          >
            ADD
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {tickers.map((t) => {
          const q = quotes[t];
          return (
            <div
              key={t}
              className="bg-t-bg border border-t-border rounded p-2.5 relative group"
            >
              <button
                onClick={() => handleRemove(t)}
                className="absolute top-1 right-1.5 text-[9px] text-t-muted hover:text-t-red opacity-0 group-hover:opacity-100 transition-opacity"
              >
                X
              </button>
              <p className="text-xs font-bold text-t-accent">{t}</p>
              {!q || q.loading ? (
                <div className="h-4 mt-1 bg-t-input rounded animate-pulse" />
              ) : q.error ? (
                <p className="text-[10px] text-t-red mt-1">--</p>
              ) : (
                <>
                  <p className="text-sm font-bold mt-0.5">
                    ${q.price.toFixed(2)}
                  </p>
                  <p
                    className={`text-[10px] ${q.changePct >= 0 ? "text-t-green" : "text-t-red"}`}
                  >
                    {q.changePct >= 0 ? "+" : ""}
                    {q.changePct.toFixed(2)}%
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
