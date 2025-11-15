<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1NMKJvVgZWrSw3CXtnUWoCthyN6FVCXzB

## Run Locally

**Prerequisites:**  Node.js, [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

1. Install dependencies:
   `npm install`
2. Create `.env.local` (copy from `.env.example` if you have one) and set the following variables:
   - `GEMINI_API_KEY=<your Gemini API key>`
   - `VITE_API_BASE_URL=http://localhost:8787/api` (or your deployed Worker URL like `https://gan-woo-ya-api.your-name.workers.dev/api`)
   > 如果填入的網址沒有帶 `/api`，前端會自動補上，確保請求能命中 Worker 的 `/api/*` 路由。
3. Start the Cloudflare Worker (runs the API + D1 access) in another terminal:
   ```bash
   cd backend-worker
   npx wrangler dev --persist
   ```
   > If you already deployed the Worker, you can skip this step and point `VITE_API_BASE_URL` to the production endpoint instead.
4. Run the web app:
   `npm run dev`
