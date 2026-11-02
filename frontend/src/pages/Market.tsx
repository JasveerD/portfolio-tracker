import { useState } from "react";
import MarketIndices from "../components/MarketIndices";
import MarketMovers from "../components/MarketMovers";
import NewsFeed from "../components/NewsFeed";
import SectorHeatmap from "../components/SectorHeatmap";
import TickerSearch from "../components/TickerSearch";
import VixGauge from "../components/VixGauge";
import Watchlist from "../components/Watchlist";
import {
  getProvider,
  setProvider,
  getProviderKey,
  setProviderKey,
  needsDelay,
  type Provider,
} from "../services/marketOverview";

const PROVIDERS: {
  value: Provider;
  label: string;
  description: string;
  link: string;
}[] = [
  {
    value: "finnhub",
    label: "Finnhub",
    description:
      "60 requests/min free — all data loads fast. Also provides market news.",
    link: "https://finnhub.io/register",
  },
  {
    value: "twelvedata",
    label: "Twelve Data",
    description:
      "8 requests/min with demo key (no signup). 800/day with free key.",
    link: "https://twelvedata.com/pricing",
  },
];

export default function Market() {
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProviderState] = useState<Provider>(() => getProvider());
  const [key, setKey] = useState(() => getProviderKey(provider));
  const [indicesDone, setIndicesDone] = useState(false);
  const [sectorsDone, setSectorsDone] = useState(false);

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
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold text-t-muted tracking-wider uppercase">
          Market Overview
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[10px] text-t-muted hover:text-t-accent px-2 py-1 rounded border border-t-border hover:border-t-accent tracking-wider uppercase"
        >
          {showSettings ? "CLOSE" : "API SETTINGS"}
        </button>
      </div>

      {showSettings && (
        <div className="bg-t-panel border border-t-border rounded p-4 space-y-4">
          <div>
            <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-2">
              Data Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  className={`text-left p-3 rounded border-2 transition-colors ${
                    provider === p.value
                      ? "border-t-accent bg-t-accent-bg"
                      : "border-t-border hover:border-t-muted"
                  }`}
                >
                  <p className="text-xs font-semibold">{p.label}</p>
                  <p className="text-[10px] text-t-muted mt-0.5">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-t-muted tracking-wider uppercase mb-1">
              API Key
            </label>
            <p className="text-[10px] text-t-muted mb-2">
              Get a free key at{" "}
              <a
                href={currentProvider.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-t-accent hover:text-t-text"
              >
                {currentProvider.label === "Finnhub"
                  ? "finnhub.io"
                  : "twelvedata.com"}
              </a>
              {provider === "twelvedata" &&
                " — or leave as 'demo' to use without signup"}
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
                className="flex-1 px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
              />
              <button
                onClick={handleSave}
                disabled={provider === "finnhub" && !key.trim()}
                className="px-4 py-1.5 bg-t-accent text-t-bg rounded text-xs font-medium hover:brightness-110 disabled:opacity-50 tracking-wide"
              >
                SAVE & RELOAD
              </button>
            </div>
          </div>
        </div>
      )}

      {slow && (
        <p className="text-[10px] text-t-accent">
          Using demo API key — data loads one symbol at a time (~8s each). Click
          "API SETTINGS" above to switch to Finnhub for faster loading.
        </p>
      )}

      <TickerSearch />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <VixGauge />
        <div className="lg:col-span-4">
          <MarketIndices onDone={() => setIndicesDone(true)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectorHeatmap
          startLoading={slow ? indicesDone : true}
          onDone={() => setSectorsDone(true)}
        />
        <MarketMovers startLoading={slow ? sectorsDone : indicesDone} />
      </div>

      <Watchlist />

      <NewsFeed />
    </div>
  );
}
