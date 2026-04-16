# The Refreshing Leader — Score Cards

Live score cards for your Leadership Operating System dashboard. Reads from your personal Notion workspace and displays your latest Inner, Shared, Owned, and Overall scores.

---

## Deploy Your Own Score Cards

Click the button below to deploy your own private version to Vercel (free):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mtahaakhan/nick-scorecard&env=NOTION_SECRET,NOTION_DATABASE_ID&envDescription=Your%20Notion%20API%20key%20and%20Monthly%20Pulse%20database%20ID&envLink=https://github.com/mtahaakhan/nick-scorecard%23setup-guide&project-name=my-leadership-scorecard&repository-name=my-leadership-scorecard)

---

## Setup Guide

You will need two things before deploying:

### 1. Your Notion API Key (`NOTION_SECRET`)

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Name it **"My Pulse"**, select your workspace, click **Save**
4. Copy the **Internal Integration Secret** — this is your `NOTION_SECRET`
5. Open your Monthly Pulse database in Notion → click **"..."** → **Connections** → add **"My Pulse"**

### 2. Your Monthly Pulse Database ID (`NOTION_DATABASE_ID`)

1. Open your Monthly Pulse database in Notion
2. Copy the URL from your browser — it looks like:
   `https://www.notion.so/yourworkspace/abc123def456...`
3. The 32-character string after the last `/` is your database ID

---

## After Deploying

1. Vercel gives you a URL like `https://my-leadership-scorecard.vercel.app`
2. Go to your Notion dashboard → **My Scores** section
3. Type `/embed` → paste your Vercel URL
4. Resize the embed block to about 110px tall
5. Your scores will now update automatically after every Monthly Pulse ✓

---

## How It Works

- The score cards poll your Notion database every 30 seconds
- Only the most recent Pulse entry is shown
- Your API key is stored securely as a Vercel environment variable — never exposed in the browser
- Everything lives in your own Vercel account — fully private
