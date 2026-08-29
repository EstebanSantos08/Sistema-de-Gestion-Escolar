import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index';

dotenv.config();

const app = express();
const defaultOrigins = [
  'https://sistema-de-gestion-escolar.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];
const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── Seguridad y utilidades ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen bloqueado por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.options('*', cors());
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
