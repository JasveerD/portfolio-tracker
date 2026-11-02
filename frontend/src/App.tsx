import { useEffect } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Backtest from "./pages/Backtest";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Portfolio from "./pages/Portfolio";

const NAV = [
  { path: "/", label: "DASH", key: "1" },
  { path: "/portfolio", label: "PORT", key: "2" },
  { path: "/backtest", label: "BACK", key: "3" },
  { path: "/market", label: "MKT", key: "4" },
];

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
    <div className="min-h-screen">
      <nav className="bg-t-panel border-b border-t-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-11">
          <span className="font-bold text-sm text-t-accent tracking-wider mr-8">
            FISHY<span className="text-t-muted">TERMINAL</span>
          </span>
          <div className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.path}
                to={n.path}
                className={`text-xs font-medium px-3 py-1.5 rounded transition-colors tracking-wide ${
                  location.pathname === n.path
                    ? "bg-t-accent-bg text-t-accent"
                    : "text-t-muted hover:text-t-text hover:bg-t-input"
                }`}
              >
                <span className="text-[9px] opacity-40 mr-1">{n.key}</span>
                {n.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-t-green animate-pulse" />
              <span className="text-[10px] text-t-muted tracking-wide">LIVE</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/market" element={<Market />} />
        </Routes>
      </main>
    </div>
  );
}
