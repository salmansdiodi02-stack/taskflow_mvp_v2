
# TaskFlow MVP v2 (Local Home Services) - Upgraded

This upgraded TaskFlow v2 includes a cleaner frontend, admin dashboard, and ready-to-enable Twilio + Stripe placeholders.

## What you get
- Frontend: `frontend/index.html` — booking form with improved UI and demo pay link behavior.
- Frontend: `frontend/admin.html` — admin dashboard to view leads and download JSON.
- Backend: `backend/server.js` — Express server with `/api/leads` and `/api/leads-list` and optional Twilio/Stripe examples.
- `backend/package.json` — Dependencies & start scripts.
- `.env.example` and `README.md` with setup & deployment instructions.
- `LICENSE` — MIT placeholder.

## Run locally (Node.js required)
1. Unzip the downloaded file (taskflow_mvp_v2.zip).
2. Open Terminal and navigate to the backend folder:
   ```bash
   cd path/to/taskflow_mvp_v2/backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` in your browser.

## Enable Twilio (SMS)
1. Install Twilio in the backend if you plan to use it: `npm install twilio`
2. Set environment variables in `backend/.env`:
```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM=+123456789
BUSINESS_NAME=Your Business
```
3. Uncomment the Twilio block in `backend/server.js` (comment markers are provided) and restart the server.

## Enable Stripe (Payments)
1. Set `STRIPE_SECRET_KEY=sk_live_xxx` in `backend/.env`.
2. Uncomment the Stripe block in `backend/server.js` to generate a payment link automatically on lead creation.

## Deploying (recommended options)
- Render.com: Create a Web Service, set the root to `backend`, and use `npm start` as the start command.
- Railway.app: Similar flow, create a project and deploy the backend folder.
- Vercel: Use a Serverless Function or API route to host the backend code (adjust as needed).

If you'd like, I can:
- Walk you through running this locally step-by-step on your Mac (Sonoma).
- Deploy it to Render.com and configure environment variables (Twilio/Stripe) for you.
- Add authentication to admin.html to protect access.
