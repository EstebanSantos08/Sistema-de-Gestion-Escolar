import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';
import './models/index'; // registrar asociaciones
import sequelize from './config/database';

const PORT = Number(process.env.PORT) || 3001;

async function bootstrap() {
  try {
    await connectDatabase();
    await sequelize.sync();
    console.log('✅ Modelos sincronizados con la base de datos.');

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
