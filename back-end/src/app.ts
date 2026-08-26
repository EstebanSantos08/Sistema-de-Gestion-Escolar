import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index';

dotenv.config();

const app = express();

// ── Seguridad y utilidades ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ──────────────────────────────────────────────────────────────────────
app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Gestión Escolar API',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

export default app;
