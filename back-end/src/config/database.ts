import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL environment variable is missing.');
}

export const postgresSslOptions = {
  require: true,
  rejectUnauthorized: false,
};

export const sequelize = new Sequelize(dbUrl || '', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: postgresSslOptions,
  },
  logging: false,
  define: {
    timestamps: true,
    underscored: false
  }
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida.');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    throw error;
  }
}

export default sequelize;
