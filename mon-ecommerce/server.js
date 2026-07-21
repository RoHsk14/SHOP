const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Import the WhatsApp bot router (which exports an Express router)
// Bot also loads .env.local for Nhost — must run after parent dotenv
const whatsappRouter = require('./services/whatsapp-bot/server');

app.prepare().then(() => {
  const server = express();

  // Mount the bot router under /api/whatsapp (same as before)
  server.use('/api/whatsapp', whatsappRouter);

  // All other routes handled by Next.js
  server.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
