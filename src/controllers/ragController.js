import axios from 'axios';
import FormData from 'form-data';

const INGEST_URL = process.env.N8N_INGEST_WEBHOOK_URL;
const QUERY_URL = process.env.N8N_QUERY_WEBHOOK_URL;

export async function proxyIngest(req, res) {
  try {
    if (!INGEST_URL) return res.status(500).json({ error: 'INGEST webhook not configured' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const form = new FormData();
    for (const file of req.files) {
      form.append('files', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    }
    if (req.body?.tags) form.append('tags', req.body.tags);

    const response = await axios.post(INGEST_URL, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

    res.json(normalizeIngestResponse(response.data));
  } catch (error) {
    console.error('Upload proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to upload to ingestion workflow' });
  }
}

export async function proxyQuery(req, res) {
  try {
    if (!QUERY_URL) return res.status(500).json({ error: 'QUERY webhook not configured' });
    const { question } = req.body || {};
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question is required' });

    const response = await axios.post(
      QUERY_URL,
      { message: question, sessionId: Math.random().toString(36).substring(2, 15)  },
      { timeout: 60000 }
    ); 
    res.json(response.data);
  } catch (error) {
    console.error('Query proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to query search workflow' });
  }
}

function normalizeIngestResponse(data) {
  return {
    status: data?.status || 'ok',
    ingestedCount: data?.ingestedCount ?? data?.count ?? data?.files?.length ?? 0,
    details: data?.details || data
  };
}



