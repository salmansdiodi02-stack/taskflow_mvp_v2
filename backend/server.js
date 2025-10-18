// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // tighten for production: set your frontend origin
});

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');
const INSTALLED_SNAPSHOTS_FILE = path.join(DATA_DIR, 'installed_snapshots.json');

// Ensure dirs and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, JSON.stringify([]));
if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR);
if (!fs.existsSync(INSTALLED_SNAPSHOTS_FILE)) fs.writeFileSync(INSTALLED_SNAPSHOTS_FILE, JSON.stringify([]));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Utility to read/write leads
function readLeads(){
  try { return JSON.parse(fs.readFileSync(LEADS_FILE)); } catch(e){ return []; }
}
function writeLeads(arr){ fs.writeFileSync(LEADS_FILE, JSON.stringify(arr, null, 2)); }

// Utility for installed snapshots
function readInstalled(){ try{ return JSON.parse(fs.readFileSync(INSTALLED_SNAPSHOTS_FILE)); }catch(e){ return []; } }
function writeInstalled(arr){ fs.writeFileSync(INSTALLED_SNAPSHOTS_FILE, JSON.stringify(arr, null, 2)); }

// HEALTH CHECK
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// === LEADS ENDPOINTS ===

// Save a lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, service, preferred, notes } = req.body || {};
    if (!name || !phone) return res.status(400).send('Name and phone are required');

    const lead = { 
      id: Date.now().toString(), 
      name, 
      phone, 
      service, 
      preferred, 
      notes, 
      createdAt: new Date().toISOString() 
    };

    const cur = readLeads();
    cur.push(lead);
    writeLeads(cur);
    console.log('✅ New lead saved:', lead);

    // Emit realtime event
    io.emit('new_lead', lead);

    return res.json({ ok: true, lead });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed saving lead');
  }
});

// Get all leads
app.get('/api/leads-list', (req, res) => {
  try {
    const cur = readLeads();
    res.json(cur.reverse());
  } catch (e) {
    res.status(500).send('error');
  }
});

// === ADMIN AUTH ===
app.post('/api/admin-login', (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD) return res.status(404).json({ ok:false, error:'no-admin' });
  if (password === process.env.ADMIN_PASSWORD) return res.json({ ok: true });
  return res.status(401).json({ ok:false, error:'Unauthorized' });
});

// === SNAPSHOTS ===

// List all snapshots
app.get('/api/snapshots', (req, res) => {
  try {
    const files = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json'));
    const snapshots = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(SNAPSHOTS_DIR,f))); }
      catch(e){ return null; }
    }).filter(Boolean);
    res.json(snapshots);
  } catch (e) {
    console.error(e);
    res.status(500).send('failed reading snapshots');
  }
});

// Install snapshot by ID
app.post('/api/install-snapshot', (req, res) => {
  try {
    const { snapshotId } = req.body || {};
    if (!snapshotId) return res.status(400).send('snapshotId required');

    const file = path.join(SNAPSHOTS_DIR, `${snapshotId}.json`);
    if (!fs.existsSync(file)) return res.status(404).send('snapshot not found');
    
    const snapshot = JSON.parse(fs.readFileSync(file));
    console.log(`⚡ Installing snapshot: ${snapshot.name}`);

    const installed = readInstalled();
    installed.push({ 
      id: snapshotId, 
      installedAt: new Date().toISOString(), 
      ...snapshot 
    });
    writeInstalled(installed);

    // Add sample leads if any
    if (Array.isArray(snapshot.sampleLeads) && snapshot.sampleLeads.length) {
      const cur = readLeads();
      snapshot.sampleLeads.forEach(s => {
        const lead = { 
          id: Date.now().toString() + Math.floor(Math.random()*1000), 
          createdAt: new Date().toISOString(), 
          ...s 
        };
        cur.push(lead);
        io.emit('new_lead', lead);
      });
      writeLeads(cur);
    }

    return res.json({ ok:true, snapshotId, installed:true, message:`Installed ${snapshot.name}` });
  } catch (e) {
    console.error(e);
    return res.status(500).send('failed installing snapshot');
  }
});

// Get installed snapshots
app.get('/api/installed-snapshots', (req,res) => {
  try { res.json(readInstalled()); } 
  catch(e){ res.status(500).send('error'); }
});

// === SPA FALLBACK ===
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// === SOCKET.IO CONNECTION ===
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// === START SERVER ===
server.listen(PORT, () => {
  console.log('🚀 TaskFlow backend listening on port', PORT);
});
