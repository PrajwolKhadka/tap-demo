const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Seed the db file on first run
db.defaults({ sessions: [] }).write();

const app = express();
app.use(cors());
app.use(express.json());

//Unity le yeta round ko result pathauxa 40 seconds ko time sakey paxi
app.post('/api/sessions', (req, res) => {
  const { playerName, tapCount } = req.body;

  if (typeof tapCount !== 'number' || Number.isNaN(tapCount)) {
    return res.status(400).json({ error: 'tapCount must be a number' });
  }

  const session = {
    id: Date.now(),
    playerName: typeof playerName === 'string' && playerName.trim() ? playerName.trim() : 'Unknown',
    tapCount,
    timestamp: new Date().toISOString()
  };

  db.get('sessions').push(session).write();

  console.log(`New session recorded: ${session.playerName} - ${session.tapCount} taps`);
  res.status(201).json(session);
});

// Dashboard polls this for the full history, newest first
app.get('/api/sessions', (req, res) => {
  const sessions = db.get('sessions').value().slice().reverse();
  res.json(sessions);
});

// Dashboard polls this for the headline "latest result" number
app.get('/api/sessions/latest', (req, res) => {
  const sessions = db.get('sessions').value();
  const latest = sessions.length ? sessions[sessions.length - 1] : null;
  res.json(latest);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VR tap backend running on http://0.0.0.0:${PORT}`);
  console.log(`Use your computer's IP (example: http://192.168.1.65:${PORT})`);
});
