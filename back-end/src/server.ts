import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';
import './models/index'; // register associations

const PORT = Number(process.env.PORT) || 3001;

/**
 * Application bootstrap.
 *
 * IMPORTANT:
 * `sequelize.sync()` and ad-hoc `ALTER TABLE` calls have been removed.
 * Schema evolution is now managed through versioned migration scripts
 * (see migrations/ directory) and must be applied explicitly with
 * appropriate preflight checks and DBA approval.
 *
 * To verify connectivity at startup we only call `authenticate()`.
 */
async function bootstrap() {
  try {
    await connectDatabase();
    // Do NOT call sequelize.sync() or ALTER TABLE here.
    // Use migration scripts for schema changes.
    console.log('✅ Base de datos verificada correctamente.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 API disponible en http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();
