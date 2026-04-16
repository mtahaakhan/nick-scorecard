// Vercel Serverless Function — proxies Notion API to avoid CORS
// API key and database ID are read from Vercel environment variables —
// never hardcoded, never exposed to the browser.

const NOTION_SECRET = process.env.NOTION_SECRET;
const DATABASE_ID   = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  // Allow embedding from anywhere (needed for Notion iframe embed)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Guard: if env vars are missing, return a helpful error
  if (!NOTION_SECRET || !DATABASE_ID) {
    return res.status(500).json({
      error: "Missing environment variables. Please set NOTION_SECRET and NOTION_DATABASE_ID in your Vercel project settings."
    });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_SECRET}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [{ property: "Month", direction: "descending" }],
          page_size: 1, // only the most recent entry
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const page = data.results[0];

    if (!page) {
      return res.status(200).json({ found: false });
    }

    const props = page.properties;

    const getNum = (key) => props[key]?.number ?? props[key]?.formula?.number ?? null;
    const getTitle = (key) => props[key]?.title?.[0]?.plain_text ?? "";
    const getDate = (key) => props[key]?.date?.start ?? null;

    return res.status(200).json({
      found: true,
      entry: getTitle("Entry"),
      month: getDate("Month"),
      inner:   { score: getNum("Inner Score"),  max: 70 },
      shared:  { score: getNum("Shared Score"), max: 50 },
      owned:   { score: getNum("Owned Score"),  max: 50 },
      overall: { score: getNum("Overall Score"),max: 210 },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
