import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import './setupEnv.js';
import apiRouter from './routes/api.js';

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({ "message": "Welcome to Wakandu AI v1.01 :)" });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', apiRouter);

export default app;


