import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Backtest from "./pages/Backtest";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";

const NAV = [
  { path: "/", label: "Dashboard" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/backtest", label: "Backtest" },
];

export default function App() {
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [dark]);

  return (
    <div className="min-h-screen">
      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
              Portfolio Tracker
            </span>
            {NAV.map((n) => (
              <Link
                key={n.path}
                to={n.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === n.path
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="text-sm px-3 py-1 rounded-lg border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/backtest" element={<Backtest />} />
        </Routes>
      </main>
    </div>
  );
}
