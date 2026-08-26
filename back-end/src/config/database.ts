import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const dbPath = path.resolve(process.env.DB_PATH || './database.sqlite');

const usePostgres = Boolean(databaseUrl);

const sequelize = new Sequelize({
  dialect: usePostgres ? 'postgres' : 'sqlite',
  ...(usePostgres
    ? {
        url: databaseUrl,
        dialectOptions:
          process.env.NODE_ENV === 'production'
            ? {
                ssl: {
                  require: true,
                  rejectUnauthorized: false,
                },
              }
            : undefined,
      }
    : {
        storage: dbPath,
      }),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log(
      usePostgres
        ? '✅ Conexión a PostgreSQL establecida.'
        : '✅ Conexión a SQLite establecida.'
    );
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    throw error;
  }
}

export default sequelize;
