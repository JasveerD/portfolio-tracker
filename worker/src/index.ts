const YAHOO = "https://query1.finance.yahoo.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return Response.json({ ok: true }, { headers: CORS_HEADERS });
    }

    if (!path.startsWith("/v8/")) {
      return Response.json(
        { error: "Only /v8/ Yahoo Finance endpoints are proxied" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const yahooUrl = `${YAHOO}${path}${url.search}`;

    try {
      const res = await fetch(yahooUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const body = await res.text();

      return new Response(body, {
        status: res.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          ...CORS_HEADERS,
        },
      });
    } catch (e) {
      return Response.json(
        { error: "Failed to fetch from Yahoo Finance" },
        { status: 502, headers: CORS_HEADERS }
      );
    }
  },
};
