// Vercel Serverless Function — returns all Monthly Pulse entries for charting
// Fetches up to 100 entries, filters out any without a Month date,
// sorts ascending so the chart reads left→right chronologically.

const NOTION_SECRET = process.env.NOTION_SECRET;
const DATABASE_ID   = process.env.NOTION_DATABASE_ID;

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
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_SECRET}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100 }),
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
      return res.status(200).json({ found: false, entries: [] });
    }

    const getNum = (props, key) =>
      props[key]?.number ?? props[key]?.formula?.number ?? null;

    const getDateVal = (props, key) =>
      props[key]?.date?.start ?? null;

    const getText = (props, key) =>
      props[key]?.title?.[0]?.plain_text ??
      props[key]?.rich_text?.[0]?.plain_text ??
      null;

    const entries = data.results
      .map(page => {
        const props = page.properties;
        const dateStr =
          getDateVal(props, "Month") ??
          getDateVal(props, "Date") ??
          null;

        if (!dateStr) return null;

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

        const label =
          getText(props, "Entry") ??
          getText(props, "Name") ??
          dateStr;

        return {
          date:  dateStr,
          label,
          inner:  innerScore,
          shared: sharedScore,
          owned:  ownedScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    return res.status(200).json({
      found: entries.length > 0,
      entries,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
