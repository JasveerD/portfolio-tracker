import { ReactNode, useState } from "react";
import CommoditiesPanel from "../components/market/Commodities";
import GlobalMarkets from "../components/market/GlobalMarkets";
import MarketIndices from "../components/market/MarketIndices";
import MarketMovers from "../components/market/MarketMovers";
import NewsFeed from "../components/market/NewsFeed";
import PairsTrading from "../components/market/PairsTrading";
import SectorHeatmap from "../components/market/SectorHeatmap";
import TickerSearch from "../components/market/TickerSearch";
import VixGauge from "../components/market/VixGauge";
import Watchlist from "../components/market/Watchlist";
import {
  getProvider,
  setProvider,
  getProviderKey,
  setProviderKey,
  getYahooProxyUrl,
  setYahooProxyUrl,
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

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center w-full mb-2 group"
      >
        <span className="text-[10px] text-t-accent mr-2 font-bold">
          {open ? "▼" : "▶"}
        </span>
        <span className="text-[10px] text-t-accent tracking-widest uppercase font-bold">
          {title}
        </span>
        <span className="flex-1 ml-2 border-b border-t-border" />
      </button>
      {open && children}
    </div>
  );
}

export default function Market() {
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProviderState] = useState<Provider>(() => getProvider());
  const [key, setKey] = useState(() => getProviderKey(provider));
  const [yahooUrl, setYahooUrl] = useState(() => getYahooProxyUrl());
  const [indicesDone, setIndicesDone] = useState(false);
  const [commoditiesDone, setCommoditiesDone] = useState(false);
  const [globalDone, setGlobalDone] = useState(false);
  const [sectorsDone, setSectorsDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleProviderChange(p: Provider) {
    setProviderState(p);
    setKey(getProviderKey(p));
  }

  function handleSave() {
    setProvider(provider);
    setProviderKey(provider, key);
    setYahooProxyUrl(yahooUrl.trim());
    sessionStorage.clear();
    setShowSettings(false);
    window.location.reload();
  }

  function handleRefresh() {
    sessionStorage.clear();
    setIndicesDone(false);
    setCommoditiesDone(false);
    setGlobalDone(false);
    setSectorsDone(false);
    setRefreshKey((k) => k + 1);
  }

  const slow = needsDelay();
  const currentProvider = PROVIDERS.find((p) => p.value === provider)!;

  return (
    <div className="space-y-3" key={refreshKey}>
      <div className="flex items-center justify-between bg-t-accent px-3 py-1">
        <h2 className="text-[11px] font-bold text-black tracking-widest uppercase">
          Market Overview
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="text-[9px] text-black/70 hover:text-black px-2 py-0.5 border border-black/20 hover:border-black/40 tracking-wider uppercase font-bold"
            title="Clear cache and reload all data"
          >
            REFRESH
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-[9px] text-black/70 hover:text-black px-2 py-0.5 border border-black/20 hover:border-black/40 tracking-wider uppercase font-bold"
          >
            {showSettings ? "CLOSE" : "SETTINGS"}
          </button>
        </div>
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

          <div className="pt-2 border-t border-t-border space-y-2">
            <label className="block text-[10px] text-t-muted tracking-wider uppercase">
              Yahoo Finance Proxy (optional)
            </label>
            <p className="text-[10px] text-t-muted">
              Free, no API key, covers every ticker. Deploy the included
              Cloudflare Worker (see <span className="text-t-text">worker/</span> folder) and paste the URL.
            </p>
            <input
              type="text"
              value={yahooUrl}
              onChange={(e) => setYahooUrl(e.target.value)}
              placeholder="https://your-worker.your-name.workers.dev"
              className="w-full px-3 py-1.5 rounded border border-t-border bg-t-input text-sm focus:outline-none focus:border-t-accent"
            />
            {yahooUrl.trim() && (
              <p className="text-[10px] text-t-green">
                Yahoo Finance is active — it will be tried first for all price data.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-t-border">
            <p className="text-[9px] text-t-muted tracking-wider">
              SHORTCUTS SHOWN IN STATUS BAR BELOW
            </p>
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

      <Section title="Indices & VIX">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <VixGauge />
          <div className="lg:col-span-4">
            <MarketIndices onDone={() => setIndicesDone(true)} />
          </div>
        </div>
      </Section>

      <Section title="Commodities">
        <CommoditiesPanel
          startLoading={slow ? indicesDone : true}
          onDone={() => setCommoditiesDone(true)}
        />
      </Section>

      <Section title="Global Markets">
        <GlobalMarkets
          startLoading={slow ? commoditiesDone : true}
          onDone={() => setGlobalDone(true)}
        />
      </Section>

      <Section title="Sectors & Movers">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectorHeatmap
            startLoading={slow ? globalDone : true}
            onDone={() => setSectorsDone(true)}
          />
          <MarketMovers startLoading={slow ? sectorsDone : indicesDone} />
        </div>
      </Section>

      <Section title="Watchlist">
        <Watchlist />
      </Section>

      <Section title="Pairs Trading" defaultOpen={false}>
        <PairsTrading />
      </Section>

      <Section title="Financial News">
        <NewsFeed />
      </Section>
    </div>
  );
}
