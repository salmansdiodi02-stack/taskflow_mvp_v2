
/*
 TaskFlow MVP v2 - Minimal Express backend with Twilio + Stripe integration placeholders.
 - POST /api/leads  => saves a lead, (optionally) sends SMS via Twilio and returns a demo payLink if STRIPE is configured.
 - GET  /api/leads-list => returns saved leads (for admin dashboard).

 To enable Twilio: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM in the .env
 To enable Stripe: set STRIPE_SECRET_KEY in the .env and uncomment Stripe usage below.
*/
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'leads.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));

function saveLead(lead){
  const cur = JSON.parse(fs.readFileSync(DATA_FILE));
  cur.push(Object.assign({id: Date.now()}, lead));
  fs.writeFileSync(DATA_FILE, JSON.stringify(cur, null, 2));
}

// Health check
app.get('/api/ping', (req, res) => res.json({ok:true}));

// Create lead endpoint
app.post('/api/leads', async (req, res) => {
  try{
    const {name, phone, service, preferred, notes} = req.body || {};
    if(!name || !phone) return res.status(400).send('Name and phone are required');
    const lead = {name, phone, service, preferred, notes, createdAt: new Date().toISOString()};
    saveLead(lead);
    console.log('New lead saved:', lead);

    // OPTIONAL: Send SMS via Twilio (uncomment and configure .env to enable)
    /*
    if(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM){
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      try{
        await client.messages.create({
          body: `Hi ${lead.name}, thanks for contacting ${process.env.BUSINESS_NAME || 'TaskFlow business'}! We'll be in touch.`,
          from: process.env.TWILIO_FROM,
          to: lead.phone
        });
        console.log('SMS sent to', lead.phone);
      }catch(e){ console.error('Failed sending SMS', e); }
    }
    */

    // OPTIONAL: Create a Stripe PaymentLink / Checkout Session (requires STRIPE_SECRET_KEY)
    let payLink = null;
    /*
    if(process.env.STRIPE_SECRET_KEY){
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // Example: create a payment link (this is simplistic - customize product/pricing)
      const session = await stripe.paymentLinks.create({
        line_items: [{price_data: {currency: 'usd',product_data:{name: 'Deposit for ' + (service || 'Service')},unit_amount:5000},quantity:1}],
        after_completion: {type: 'redirect',redirect:{url:process.env.AFTER_PAYMENT_REDIRECT || 'https://example.com/thank-you'}},
      });
      payLink = session.url;
    }
    */

    return res.json({ok:true, payLink});
  }catch(err){
    console.error(err);
    return res.status(500).send('Failed saving lead');
  }
});

// Leads list for admin dashboard
app.get('/api/leads-list', (req, res) => {
  try{
    const cur = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(cur.reverse());
  }catch(e){ res.status(500).send('error'); }
});

// Serve frontend for other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log('TaskFlow MVP v2 listening on port', PORT);
});
