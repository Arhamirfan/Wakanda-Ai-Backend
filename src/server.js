import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import app from './app.js';

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Serve built frontend (CRA) only when explicitly enabled.
// For separate backend deployment (serverless), we must NOT try to serve
// static files from ../../client/build because that folder won't exist.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuild = path.resolve(__dirname, '../../client/build');

if (process.env.SERVE_CLIENT === 'true') {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) return res.sendFile(path.join(clientBuild, 'index.html'));
    return res.status(404).end();
  });
} else {
  // When not serving client, ensure API and health endpoints remain available.
}

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


