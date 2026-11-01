import { useState } from "react";
import MarketIndices from "../components/MarketIndices";
import NewsFeed from "../components/NewsFeed";
import SectorHeatmap from "../components/SectorHeatmap";
import { getStoredApiKey, setApiKey } from "../services/marketOverview";

export default function Market() {
  const [showSettings, setShowSettings] = useState(false);
  const [key, setKey] = useState(() => getStoredApiKey());
  const [indicesDone, setIndicesDone] = useState(false);

  function handleSave() {
    setApiKey(key);
    setShowSettings(false);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Overview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Live market indices, sector performance, and financial news
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
        >
          {showSettings ? "Close" : "API Settings"}
        </button>
      </div>

      {showSettings && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The free demo key is rate-limited to ~8 requests/minute, so data
            loads slowly. Get a free Twelve Data API key at{" "}
            <a
              href="https://twelvedata.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-600"
            >
              twelvedata.com
            </a>{" "}
            (800 requests/day free) for faster loading.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter API key or leave as 'demo'"
              className="flex-1 px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Save & Reload
            </button>
          </div>
        </div>
      )}

      {getStoredApiKey() === "demo" && (
        <p className="text-xs text-amber-500 dark:text-amber-400">
          Using demo API key — data loads one symbol at a time (~8s each).
          Cached for 30 min after first load.
        </p>
      )}

      <MarketIndices onDone={() => setIndicesDone(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorHeatmap startLoading={indicesDone} />
        <NewsFeed />
      </div>
    </div>
  );
}
