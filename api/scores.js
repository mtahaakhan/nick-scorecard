// Vercel Serverless Function — proxies Notion API to avoid CORS
// API key and database ID are read from Vercel environment variables —
// never hardcoded, never exposed to the browser.

const NOTION_SECRET = process.env.NOTION_SECRET;
const DATABASE_ID   = process.env.NOTION_PULSE_DATABASE_ID;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!NOTION_SECRET || !DATABASE_ID) {
    return res.status(500).json({
      error: "Missing environment variables. Please set NOTION_SECRET and NOTION_DATABASE_ID in your Vercel project settings."
    });
  }

  try {
    // No sorts — avoids 400 if property name differs between workspaces.
    // We sort by date in JS after fetching.
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_SECRET}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 10 }),
      }
    );

    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Notion API error ${response.status}`,
        detail: raw,
      });
    }

    const data = JSON.parse(raw);

    if (!data.results || data.results.length === 0) {
      return res.status(200).json({ found: false });
    }

    const getNum = (props, key) =>
      props[key]?.number ?? props[key]?.formula?.number ?? null;

    const getDateVal = (props, key) =>
      props[key]?.date?.start ?? null;

    const dated = data.results.map(page => {
      const props = page.properties;
      const dateStr =
        getDateVal(props, "Month") ??
        getDateVal(props, "Date") ??
        page.last_edited_time;
      return { page, dateStr };
    });

    dated.sort((a, b) => (a.dateStr < b.dateStr ? 1 : -1));
    const { page } = dated[0];
    const props = page.properties;

    const innerScore =
      getNum(props, "Inner Score") ??
      getNum(props, "Inner") ??
      getNum(props, "inner_score") ?? null;

    const sharedScore =
      getNum(props, "Shared Score") ??
      getNum(props, "Shared") ??
      getNum(props, "shared_score") ?? null;

    const ownedScore =
      getNum(props, "Owned Score") ??
      getNum(props, "Owned") ??
      getNum(props, "owned_score") ?? null;

    const overallScore =
      getNum(props, "Overall Score") ??
      getNum(props, "Overall") ??
      getNum(props, "overall_score") ?? null;

    const propertyKeys = Object.keys(props);

    return res.status(200).json({
      found: true,
      propertyKeys,
      inner:   { score: innerScore,   max: 70  },
      shared:  { score: sharedScore,  max: 50  },
      owned:   { score: ownedScore,   max: 50  },
      overall: { score: overallScore, max: 210 },
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
