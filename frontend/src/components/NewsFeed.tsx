import { useEffect, useState } from "react";
import { fetchMarketNews, type NewsArticle } from "../services/marketOverview";

const SENTIMENT_BADGE: Record<string, string> = {
  Bullish: "bg-t-green-bg text-t-green",
  "Somewhat-Bullish": "bg-t-green-bg text-t-green",
  Neutral: "bg-t-input text-t-muted",
  "Somewhat-Bearish": "bg-t-red-bg text-t-red",
  Bearish: "bg-t-red-bg text-t-red",
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
    <div className="bg-t-panel border border-t-border rounded p-4">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-3">
        Financial News
      </h3>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-20 h-14 bg-t-input rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-t-input rounded w-3/4" />
                <div className="h-3 bg-t-input rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-t-red">Could not load news: {error}</p>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-xs text-t-muted space-y-2">
          <p>
            News requires an API key. Add a free{" "}
            <a
              href="https://finnhub.io/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-t-accent hover:text-t-text"
            >
              Finnhub
            </a>{" "}
            key in API Settings above to get market news (and faster data loading).
          </p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-2 -mx-2 rounded hover:bg-t-input/50 transition-colors group"
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
                <p className="text-xs text-t-text group-hover:text-t-accent line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-t-muted">{a.source}</span>
                  <span className="text-[10px] text-t-muted">
                    {a.publishedAt}
                  </span>
                  {a.sentiment && a.sentiment !== "Neutral" && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
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
