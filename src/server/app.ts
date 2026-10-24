import express from 'express';
import { apiRouter } from './api';
import { db } from './db';

const app = express();

app.use(async (_req, _res, next) => {
  try {
    await db.ready;
    next();
  } catch (error) {
    next(error);
  }
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/api', apiRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Application request failed:', error);
  res.status(500).json({ error: error?.message || 'Erreur interne du serveur' });
});

export default app;
