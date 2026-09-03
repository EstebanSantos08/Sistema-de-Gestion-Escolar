import dotenv from 'dotenv';
import http from 'http';
import app from '../app';
import sequelize, { postgresSslOptions } from '../config/database';
import {
  User,
  Student,
  Teacher,
  Course,
  Enrollment,
  Grade,
} from '../models/index';

dotenv.config();

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  detail: string;
}

interface HttpResponse {
  status: number;
  body: unknown;
}

interface LoginBody {
  success?: boolean;
  data?: { token?: string };
}

const results: TestResult[] = [];
const warnings: string[] = [];

function record(name: string, startedAt: number, passed: boolean, detail: string): void {
  results.push({ name, passed, durationMs: Date.now() - startedAt, detail });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateDatabaseUrl(): URL {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error('DATABASE_URL no está definida o está vacía');

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL no tiene formato de URL válido');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error(`protocolo no soportado: ${parsed.protocol}`);
  }
  if (!parsed.hostname) throw new Error('DATABASE_URL no contiene host');
  return parsed;
}

function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method,
        headers: {
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let parsed: unknown = text;
          try {
            parsed = JSON.parse(text) as unknown;
          } catch {
            parsed = text;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function endpointTest(
  name: string,
  path: string,
  baseUrl: string,
  predicate: (response: HttpResponse) => boolean,
  token?: string,
  successDetail = 'status 200'
): Promise<void> {
  const startedAt = Date.now();
  try {
    const response = await request(baseUrl, 'GET', path, undefined, token);
    if (!predicate(response)) throw new Error(`status=${response.status}`);
    record(name, startedAt, true, successDetail);
  } catch (error) {
    record(name, startedAt, false, errorMessage(error));
  }
}

function printSummary(): void {
  console.log('\nResultados:');
  for (const result of results) {
    console.log(`${result.passed ? '✔ PASS' : '✖ FAIL'} ${result.name} (${result.durationMs} ms) - ${result.detail}`);
  }
  console.log('\nAdvertencias:');
  if (warnings.length === 0) console.log('ninguna');
  warnings.forEach((warning) => console.log(`- ${warning}`));
  const passed = results.filter((result) => result.passed).length;
  console.log(`\nResumen: ${passed}/${results.length} tests PASS`);
}

async function run(): Promise<void> {
  console.log('\n=== Suite local del backend ===');

  let dbUrl: URL;
  const configStart = Date.now();
  try {
    dbUrl = validateDatabaseUrl();
    if (postgresSslOptions.rejectUnauthorized !== false) {
      throw new Error('Sequelize no tiene SSL con rejectUnauthorized=false');
    }
    record('Configuración DATABASE_URL + SSL', configStart, true, `${dbUrl.protocol}//${dbUrl.hostname}`);
  } catch (error) {
    record('Configuración DATABASE_URL + SSL', configStart, false, errorMessage(error));
    printSummary();
    process.exitCode = 1;
    return;
  }

  const dbStart = Date.now();
  try {
    await sequelize.authenticate();
    const counts = await Promise.all([
      User.count(),
      Student.count(),
      Teacher.count(),
      Course.count(),
      Enrollment.count(),
      Grade.count(),
    ]);
    const names = ['users', 'students', 'teachers', 'courses', 'enrollments', 'grades'];
    const detail = counts.map((count, index) => `${names[index]}=${count}`).join(', ');
    if (counts.some((count) => count === 0)) warnings.push(`Hay tablas principales sin registros: ${detail}`);
    record('Conexión PostgreSQL y lectura de tablas', dbStart, true, detail);
  } catch (error) {
    record('Conexión PostgreSQL y lectura de tablas', dbStart, false, errorMessage(error));
    printSummary();
    process.exitCode = 1;
    return;
  }

  const server = await new Promise<http.Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await endpointTest('GET /', '/', baseUrl, (response) => response.status === 200);
    await endpointTest('GET /health', '/health', baseUrl, (response) => response.status === 200);

    const loginStart = Date.now();
    try {
      const email = process.env.TEST_LOGIN_EMAIL;
      const password = process.env.TEST_LOGIN_PASSWORD;
      if (!email || !password) {
        throw new Error('Define TEST_LOGIN_EMAIL y TEST_LOGIN_PASSWORD para probar login');
      }
      const response = await request(baseUrl, 'POST', '/api/auth/login', { email, password });
      const body = response.body as LoginBody;
      const token = body.data?.token;
      if (response.status !== 200 || body.success !== true || !token) {
        throw new Error(`status=${response.status}; respuesta sin token JWT`);
      }
      record('POST /api/auth/login', loginStart, true, 'token JWT recibido');

      await endpointTest('GET /api/teachers', '/api/teachers', baseUrl, (result) => {
        if (result.status !== 200) return false;
        const data = (result.body as { data?: Array<{ user?: unknown; courses?: unknown[] }> }).data;
        return Array.isArray(data) && data.every((teacher) => teacher.user !== undefined && Array.isArray(teacher.courses));
      }, token, 'lista y relaciones user/courses cargadas');
      await endpointTest('GET /api/students', '/api/students', baseUrl, (result) => result.status === 200, token);
      await endpointTest('GET /api/courses', '/api/courses', baseUrl, (result) => result.status === 200, token);
    } catch (error) {
      record('POST /api/auth/login', loginStart, false, errorMessage(error));
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await sequelize.close();
  }

  printSummary();
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}

run().catch((error: unknown) => {
  console.error(`\n✖ Error inesperado: ${errorMessage(error)}`);
  process.exitCode = 1;
});
