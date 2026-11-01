import { Link, Route, Routes, useLocation } from "react-router-dom";
import Backtest from "./pages/Backtest";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Portfolio from "./pages/Portfolio";

const NAV = [
  { path: "/", label: "DASH" },
  { path: "/portfolio", label: "PORT" },
  { path: "/backtest", label: "BACK" },
  { path: "/market", label: "MKT" },
];

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <nav className="bg-t-panel border-b border-t-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-11">
          <span className="font-bold text-sm text-t-accent tracking-wider mr-8">
            PORTFOLIO<span className="text-t-muted">TRACKER</span>
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
