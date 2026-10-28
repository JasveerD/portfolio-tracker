import { useEffect, useState } from "react";
import { api } from "../api/client";
import HoldingCard from "../components/HoldingCard";
import type { Holding, HoldingCreate } from "../types";

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<HoldingCreate>({
    ticker: "",
    shares: 0,
    buy_price: 0,
    buy_date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    api
      .getHoldings()
      .then(setHoldings)
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHolding(form);
      setForm({
        ticker: "",
        shares: 0,
        buy_price: 0,
        buy_date: new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add holding");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteHolding(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Holdings</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          {showForm ? "Cancel" : "+ Add Holding"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Ticker
            </label>
            <input
              type="text"
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
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
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
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
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Buy Date
            </label>
            <input
              type="date"
              value={form.buy_date}
              onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2 md:col-span-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {holdings.length === 0 && !showForm ? (
        <p className="text-gray-500">
          No holdings yet. Click &quot;+ Add Holding&quot; to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((h) => (
            <HoldingCard key={h.id} holding={h} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
