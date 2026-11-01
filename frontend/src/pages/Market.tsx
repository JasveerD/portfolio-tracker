import { useState } from "react";
import MarketIndices from "../components/MarketIndices";
import NewsFeed from "../components/NewsFeed";
import SectorHeatmap from "../components/SectorHeatmap";
import {
  getProvider,
  setProvider,
  getProviderKey,
  setProviderKey,
  needsDelay,
  type Provider,
} from "../services/marketOverview";

const PROVIDERS: { value: Provider; label: string; description: string; link: string }[] = [
  {
    value: "finnhub",
    label: "Finnhub",
    description: "60 requests/min free — all data loads in ~15 seconds. Also provides market news.",
    link: "https://finnhub.io/register",
  },
  {
    value: "twelvedata",
    label: "Twelve Data",
    description: "8 requests/min with demo key (no signup). 800/day with free key.",
    link: "https://twelvedata.com/pricing",
  },
];

export default function Market() {
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProviderState] = useState<Provider>(() => getProvider());
  const [key, setKey] = useState(() => getProviderKey(provider));
  const [indicesDone, setIndicesDone] = useState(false);

  function handleProviderChange(p: Provider) {
    setProviderState(p);
    setKey(getProviderKey(p));
  }

  function handleSave() {
    setProvider(provider);
    setProviderKey(provider, key);
    sessionStorage.clear();
    setShowSettings(false);
    window.location.reload();
  }

  const slow = needsDelay();
  const currentProvider = PROVIDERS.find((p) => p.value === provider)!;

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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    provider === p.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Get a free key at{" "}
              <a
                href={currentProvider.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600"
              >
                {currentProvider.label === "Finnhub"
                  ? "finnhub.io"
                  : "twelvedata.com"}
              </a>
              {provider === "twelvedata" && " — or leave as 'demo' to use without signup"}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={
                  provider === "finnhub"
                    ? "Paste your Finnhub API key"
                    : "Enter API key or leave as 'demo'"
                }
                className="flex-1 px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSave}
                disabled={provider === "finnhub" && !key.trim()}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      )}

      {slow && (
        <p className="text-xs text-amber-500 dark:text-amber-400">
          Using demo API key — data loads one symbol at a time (~8s each).
          Click "API Settings" above to switch to Finnhub for faster loading.
        </p>
      )}

      <MarketIndices onDone={() => setIndicesDone(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorHeatmap startLoading={slow ? indicesDone : true} />
        <NewsFeed />
      </div>
    </div>
  );
}
