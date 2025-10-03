// ragController.js
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const INGEST_URL = process.env.N8N_INGEST_WEBHOOK_URL;
const QUERY_URL  = process.env.N8N_QUERY_WEBHOOK_URL;

// Optional: set to the exact SHA-256 fingerprint of your n8n TLS cert (UPPERCASE, colon-separated)
// Example format: "AB:CD:...:EF"
const PINNED_FP = process.env.N8N_CERT_SHA256?.trim();

// Build a scoped HTTPS agent for these webhook calls only
function buildHttpsAgent() {
  // Keep connection reuse efficient
  const base = {
    keepAlive: true,
    // When connecting by IP with a self-signed cert, SNI isn't helpful, but set anyway
    // so Node doesn't try to infer a bogus name.
    servername: '3.138.245.104',
  };

  if (PINNED_FP) {
    // Cert pinning path (preferred)
    return new https.Agent({
      ...base,
      rejectUnauthorized: false, // we’ll do our own identity check
      checkServerIdentity: (_host, cert) => {
        // Node exposes SHA-256 as "fingerprint256" in the format "AA:BB:..."
        const got = (cert.fingerprint256 || '').toUpperCase();
        if (got !== PINNED_FP.toUpperCase()) {
          throw new Error(`Pinned certificate mismatch. Expected ${PINNED_FP}, got ${got}`);
        }
        return undefined; // accept
      },
    });
  }

  // Temporary unblock path (no pin)
  return new https.Agent({
    ...base,
    rejectUnauthorized: false, // scoped to these requests ONLY
  });
}

const httpsAgent = buildHttpsAgent();

// Reusable axios for webhook calls
const webhookAxios = axios.create({
  httpsAgent,
  timeout: 120_000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  // Explicitly set to avoid proxies interfering
  proxy: false,
});

export async function proxyIngest(req, res) {
  try {
    if (!INGEST_URL) return res.status(500).json({ error: 'INGEST webhook not configured' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const form = new FormData();
    for (const file of req.files) {
      form.append('files', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    }
    if (req.body?.tags) form.append('tags', req.body.tags);

    const response = await webhookAxios.post(INGEST_URL, form, {
      headers: form.getHeaders(),
    });

    res.json(normalizeIngestResponse(response.data));
  } catch (error) {
    console.error('Upload proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to upload to ingestion workflow', message: error?.response?.data || error.message } );
  }
}

export async function proxyQuery(req, res) {
  try {
    if (!QUERY_URL) return res.status(500).json({ error: 'QUERY webhook not configured' });
    const { question } = req.body || {};
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question is required' });

    const payload = {
      message: question,
      sessionId: Math.random().toString(36).substring(2, 15),
    };

    const response = await webhookAxios.post(QUERY_URL, payload);
    res.json(response.data);
  } catch (error) {
    console.error('Query proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to query search workflow', message: error?.response?.data || error.message  });
  }
}

function normalizeIngestResponse(data) {
  return {
    status: data?.status || 'ok',
    ingestedCount: data?.ingestedCount ?? data?.count ?? data?.files?.length ?? 0,
    details: data?.details || data,
  };
}
