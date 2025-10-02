import app from '../src/app.js';

// Vercel (and other serverless platforms) expect a default export handler.
// Express apps are compatible as request handlers, so we can forward requests.
export default function handler(req, res) {
  return app(req, res);
}
