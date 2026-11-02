import { useCallback, useEffect, useState } from "react";
import HoldingCard from "../components/portfolio/HoldingCard";
import { fetchCurrentPrice } from "../services/marketData";
import {
  addHolding,
  deleteHolding,
  getHoldings,
} from "../services/storage";
import type { Holding, HoldingCreate } from "../types";

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<HoldingCreate>({
    ticker: "",
    shares: 0,
    buy_price: 0,
    buy_date: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const raw = getHoldings();
    const enriched = await Promise.all(
      raw.map(async (h) => {
        const price = await fetchCurrentPrice(h.ticker);
        return {
          ...h,
          current_price: price,
          gain_loss_pct: price
            ? Math.round((price / h.buy_price - 1) * 10000) / 100
            : null,
        };
      })
    );
    setHoldings(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addHolding(form);
    setForm({
      ticker: "",
      shares: 0,
      buy_price: 0,
      buy_date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(false);
    load();
  };

  const handleDelete = (id: number) => {
    deleteHolding(id);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center bg-t-accent px-3 py-1">
        <h2 className="text-[11px] font-bold text-black tracking-widest uppercase">
          Holdings
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-2 py-0.5 text-[9px] font-bold text-black/70 hover:text-black border border-black/20 hover:border-black/40 tracking-wider"
        >
          {showForm ? "CANCEL" : "+ ADD"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-t-panel border border-t-border rounded p-4 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div>
            <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
              Ticker
            </label>
            <input
              type="text"
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              required
              className="w-full px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
              Shares
            </label>
            <input
              type="number"
              step="any"
              value={form.shares || ""}
              onChange={(e) =>
                setForm({ ...form, shares: Number(e.target.value) })
              }
              required
              className="w-full px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
              Buy Price
            </label>
            <input
              type="number"
              step="0.01"
              value={form.buy_price || ""}
              onChange={(e) =>
                setForm({ ...form, buy_price: Number(e.target.value) })
              }
              required
              className="w-full px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
              Buy Date
            </label>
            <input
              type="date"
              value={form.buy_date}
              onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
              required
              className="w-full px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
            />
          </div>
          <div className="col-span-2 md:col-span-4">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-t-green text-t-bg rounded hover:brightness-110 tracking-wide"
            >
              SAVE
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-t-muted text-sm">Loading prices...</p>
      ) : holdings.length === 0 && !showForm ? (
        <p className="text-t-muted text-sm">
          No holdings yet. Click "+ ADD" to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {holdings.map((h) => (
            <HoldingCard key={h.id} holding={h} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
