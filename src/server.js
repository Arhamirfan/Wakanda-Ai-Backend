import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import app from './app.js';

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Serve built frontend (CRA)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuild = path.resolve(__dirname, '../../client/build');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) return res.sendFile(path.join(clientBuild, 'index.html'));
  return res.status(404).end();
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


