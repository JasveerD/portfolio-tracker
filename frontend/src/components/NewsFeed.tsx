import { useEffect, useState } from "react";
import { fetchMarketNews, type NewsArticle } from "../services/marketOverview";

const SENTIMENT_BADGE: Record<string, string> = {
  Bullish: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Somewhat-Bullish":
    "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  Neutral: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  "Somewhat-Bearish":
    "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  Bearish: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketNews()
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h3 className="text-lg font-bold mb-4">Financial News</h3>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">Could not load news: {error}</p>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            News is unavailable with the demo API key. Get a free Alpha Vantage
            key at{" "}
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-600"
            >
              alphavantage.co
            </a>{" "}
            for financial news with sentiment analysis.
          </p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              {a.image && (
                <img
                  src={a.image}
                  alt=""
                  className="w-20 h-14 object-cover rounded shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-gray-400">
                    {a.source}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {a.publishedAt}
                  </span>
                  {a.sentiment && a.sentiment !== "Neutral" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        SENTIMENT_BADGE[a.sentiment] ||
                        SENTIMENT_BADGE.Neutral
                      }`}
                    >
                      {a.sentiment.replace("Somewhat-", "")}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
