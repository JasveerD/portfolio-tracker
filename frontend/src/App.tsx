import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Backtest from "./pages/Backtest";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Portfolio from "./pages/Portfolio";

const NAV = [
  { path: "/", label: "DASH", key: "1", fn: "F1" },
  { path: "/portfolio", label: "PORT", key: "2", fn: "F2" },
  { path: "/backtest", label: "BACK", key: "3", fn: "F3" },
  { path: "/market", label: "MKT", key: "4", fn: "F4" },
];

function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (n: number) => String(n).padStart(2, "0");
  const d = time;
  const dateStr = `${fmt(d.getMonth() + 1)}/${fmt(d.getDate())}/${d.getFullYear()}`;
  const timeStr = `${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
  const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];

  const h = d.getHours();
  const isMarketOpen = d.getDay() >= 1 && d.getDay() <= 5 && h >= 9 && h < 16;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-t-panel border-t border-t-border h-6 flex items-center px-3 text-[10px] font-mono">
      <span className="text-t-accent font-bold tracking-wider">FISHY</span>
      <span className="text-t-muted ml-1 tracking-wider">TERMINAL</span>
      <span className="mx-3 text-t-border">|</span>
      <span className="text-t-muted">{day}</span>
      <span className="text-t-text ml-1.5">{dateStr}</span>
      <span className="text-t-text ml-2">{timeStr}</span>
      <span className="mx-3 text-t-border">|</span>
      {isMarketOpen ? (
        <>
          <span className="w-1.5 h-1.5 bb-keep-round bg-t-green animate-pulse" />
          <span className="text-t-green ml-1.5">MKT OPEN</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 bb-keep-round bg-t-red" />
          <span className="text-t-red ml-1.5">MKT CLOSED</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-t-muted">
          <span className="text-t-border">[</span>1<span className="text-t-border">]</span>DASH
          {" "}<span className="text-t-border">[</span>2<span className="text-t-border">]</span>PORT
          {" "}<span className="text-t-border">[</span>3<span className="text-t-border">]</span>BACK
          {" "}<span className="text-t-border">[</span>4<span className="text-t-border">]</span>MKT
          {" "}<span className="text-t-border">[</span>/<span className="text-t-border">]</span>SEARCH
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const nav = NAV.find((n) => n.key === e.key);
      if (nav) {
        e.preventDefault();
        navigate(nav.path);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="SEARCH"]'
        );
        searchInput?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  return (
    <div className="min-h-screen pb-6">
      {/* Bloomberg top amber stripe */}
      <div className="h-0.5 bg-t-accent" />

      <nav className="bg-t-panel border-b border-t-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 flex items-center h-9">
          <span className="font-bold text-xs text-t-accent tracking-widest mr-6">
            FISHY<span className="text-t-muted">TERMINAL</span>
          </span>
          <div className="flex items-center">
            {NAV.map((n) => {
              const active = location.pathname === n.path;
              return (
                <Link
                  key={n.path}
                  to={n.path}
                  className={`relative text-[11px] font-medium px-3 py-1.5 tracking-wider border-r border-t-border transition-colors ${
                    active
                      ? "bg-t-accent text-black"
                      : "text-t-muted hover:text-t-accent hover:bg-t-accent-bg"
                  }`}
                >
                  <span className={`text-[9px] mr-1 ${active ? "text-black/60" : "text-t-border"}`}>
                    {n.fn}
                  </span>
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 bb-keep-round bg-t-green animate-pulse" />
            <span className="text-[10px] text-t-green tracking-wider font-medium">CONNECTED</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 py-3">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/market" element={<Market />} />
        </Routes>
      </main>

      <StatusBar />
    </div>
  );
}
