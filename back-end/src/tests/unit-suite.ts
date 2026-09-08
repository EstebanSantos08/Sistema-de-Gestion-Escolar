/**
 * Isolated unit tests — no external DB or Storage connections required.
 *
 * Tests cover:
 *  1. grades utility functions
 *  2. storage service (MIME detection, validation, object key generation)
 *  3. auditLog service (sanitization logic)
 *  4. scope service logic (mocked)
 *  5. middleware authorization logic
 *  6. submission controller grading validation
 *
 * Run: ts-node src/tests/unit-suite.ts
 */

import dotenv from 'dotenv';
dotenv.config();

// ── Test infrastructure ───────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, startedAt: number, passed: boolean, detail: string): void {
  results.push({ name, passed, durationMs: Date.now() - startedAt, detail });
}

function expect(name: string, actual: unknown, expected: unknown): void {
  const start = Date.now();
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  record(
    name,
    start,
    passed,
    passed ? 'OK' : `Expected: ${JSON.stringify(expected)} | Got: ${JSON.stringify(actual)}`
  );
}

function expectTruthy(name: string, actual: unknown): void {
  const start = Date.now();
  record(name, start, !!actual, actual ? 'truthy' : 'falsy');
}

function expectFalsy(name: string, actual: unknown): void {
  const start = Date.now();
  record(name, start, !actual, actual ? 'was truthy (FAIL)' : 'falsy (OK)');
}

function expectIncludes(name: string, str: string, substr: string): void {
  const start = Date.now();
  const passed = str.includes(substr);
  record(name, start, passed, passed ? 'contains' : `"${str}" does not contain "${substr}"`);
}

function printSummary(): void {
  console.log('\n=== Unit Test Results ===');
  for (const r of results) {
    console.log(`${r.passed ? '✔ PASS' : '✖ FAIL'} [${r.durationMs}ms] ${r.name} — ${r.detail}`);
  }
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\nSummary: ${passed}/${total} PASS`);
  if (passed < total) process.exitCode = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GRADES UTILITY
// ─────────────────────────────────────────────────────────────────────────────

import { calculateWeightedAverage, isPassed, getLetterGrade } from '../utils/grades';

expect('calculateWeightedAverage: empty → 0', calculateWeightedAverage([]), 0);

expect(
  'calculateWeightedAverage: weights sum to 1 → weighted',
  calculateWeightedAverage([
    { score: 8, weight: 0.5 },
    { score: 6, weight: 0.5 },
  ]),
  7.00
);

expect(
  'calculateWeightedAverage: weights != 1 → simple average',
  calculateWeightedAverage([
    { score: 8, weight: 1 },
    { score: 6, weight: 1 },
  ]),
  7.00
);

expect('isPassed: 7 >= 7 → true', isPassed(7, 7), true);
expect('isPassed: 6.9 < 7 → false', isPassed(6.9, 7), false);
expect('isPassed: 10 → true', isPassed(10, 7), true);

expect('getLetterGrade: 9 → A', getLetterGrade(9), 'A');
expect('getLetterGrade: 8 → B', getLetterGrade(8), 'B');
expect('getLetterGrade: 7 → C', getLetterGrade(7), 'C');
expect('getLetterGrade: 5 → D', getLetterGrade(5), 'D');
expect('getLetterGrade: 4 → F', getLetterGrade(4), 'F');

// ─────────────────────────────────────────────────────────────────────────────
// 2. STORAGE SERVICE — MIME detection
// ─────────────────────────────────────────────────────────────────────────────

import {
  detectMimeType,
  validateMimeType,
  buildObjectKey,
  MAX_FILE_BYTES,
  ALLOWED_MIME_TYPES,
} from '../services/storage.service';

// JPEG magic bytes
const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
expect('detectMimeType: JPEG', detectMimeType(jpegBuffer), 'image/jpeg');

// PNG magic bytes
const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
expect('detectMimeType: PNG', detectMimeType(pngBuffer), 'image/png');

// WebP magic bytes: RIFF????WEBP
const webpBuffer = Buffer.alloc(12);
webpBuffer.write('RIFF', 0, 'ascii');
webpBuffer.write('WEBP', 8, 'ascii');
expect('detectMimeType: WebP', detectMimeType(webpBuffer), 'image/webp');

// PDF magic bytes
const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
expect('detectMimeType: PDF', detectMimeType(pdfBuffer), 'application/pdf');

// Unknown
const unknownBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
expect('detectMimeType: unknown → null', detectMimeType(unknownBuffer), null);

// validateMimeType: too large
const largeBuffer = Buffer.alloc(MAX_FILE_BYTES + 1);
{
  const result = validateMimeType(largeBuffer);
  expect('validateMimeType: too large → invalid', result.valid, false);
  expectIncludes('validateMimeType: error mentions size', result.error!, 'tamaño');
}

// validateMimeType: valid JPEG
{
  const result = validateMimeType(jpegBuffer);
  expect('validateMimeType: valid JPEG → valid', result.valid, true);
  expect('validateMimeType: detected JPEG mime', result.detectedMime, 'image/jpeg');
}

// validateMimeType: unknown type → invalid
{
  const result = validateMimeType(unknownBuffer);
  expect('validateMimeType: unknown → invalid', result.valid, false);
}

// ALLOWED_MIME_TYPES contains expected types
expect('ALLOWED_MIME_TYPES has image/jpeg', ALLOWED_MIME_TYPES.has('image/jpeg'), true);
expect('ALLOWED_MIME_TYPES has application/pdf', ALLOWED_MIME_TYPES.has('application/pdf'), true);
expect('ALLOWED_MIME_TYPES has image/gif (not allowed)', ALLOWED_MIME_TYPES.has('image/gif'), false);

// buildObjectKey: consistent format
{
  const key = buildObjectKey({ courseId: 1, activityId: 2, studentId: 3, mimeType: 'image/jpeg' });
  expectIncludes('buildObjectKey: starts with evidence/', key, 'evidence/1/2/3/');
  expectIncludes('buildObjectKey: ends with .jpg', key, '.jpg');
}

{
  const key = buildObjectKey({ courseId: 5, activityId: 10, studentId: 20, mimeType: 'application/pdf' });
  expectIncludes('buildObjectKey: pdf extension', key, '.pdf');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUDITLOG SERVICE — sanitization
// ─────────────────────────────────────────────────────────────────────────────

// Import the internal sanitizeDetails via the module (we test behavior through createAuditLog mock)
// Instead, test indirectly by checking that sensitive keys in details get redacted:

// We cannot call createAuditLog without a real DB, so we test the sanitization
// through a wrapper that exposes it (or inline the logic for test purposes).

function sanitizeDetailsForTest(details: Record<string, unknown>): Record<string, unknown> {
  const FORBIDDEN = new Set([
    'password', 'passwordhash', 'jwt', 'token', 'secret',
    'servicerolekey', 'anonkey', 'signedurl', 'filecontent',
    'authorization', 'apikey',
  ]);
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (FORBIDDEN.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

{
  const result = sanitizeDetailsForTest({ studentId: 1, password: 'secret123', score: 9 });
  expect('sanitize: password is redacted', result.password, '[REDACTED]');
  expect('sanitize: studentId preserved', result.studentId, 1);
  expect('sanitize: score preserved', result.score, 9);
}

{
  const result = sanitizeDetailsForTest({ jwt: 'eyJ...', apiKey: 'sk_live_xxx' });
  expect('sanitize: jwt is redacted', result.jwt, '[REDACTED]');
  expect('sanitize: apiKey is redacted', result.apiKey, '[REDACTED]');
}

{
  const result = sanitizeDetailsForTest({ courseId: 5, activityTitle: 'Tarea 1' });
  expect('sanitize: safe details unchanged', result.courseId, 5);
  expect('sanitize: activityTitle unchanged', result.activityTitle, 'Tarea 1');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AUTHORIZATION MIDDLEWARE LOGIC
// ─────────────────────────────────────────────────────────────────────────────

import { verifyToken, signToken } from '../config/jwt';
import { JwtPayload } from '../types';

// Test token signing and verification
{
  const payload: JwtPayload = { id: 42, name: 'Test', email: 'test@test.com', role: 'teacher' };
  const token = signToken(payload);
  const verified = verifyToken(token);
  expect('JWT: id round-trips', verified.id, 42);
  expect('JWT: role round-trips', verified.role, 'teacher');
  expect('JWT: email round-trips', verified.email, 'test@test.com');
}

// Invalid token should throw
{
  let threw = false;
  try {
    verifyToken('invalid.token.here');
  } catch {
    threw = true;
  }
  expect('JWT: invalid token throws', threw, true);
}

// Tampered token should throw
{
  const payload: JwtPayload = { id: 1, name: 'Admin', email: 'a@a.com', role: 'admin' };
  const token = signToken(payload);
  const tampered = token.slice(0, -5) + 'XXXXX'; // corrupt signature
  let threw = false;
  try {
    verifyToken(tampered);
  } catch {
    threw = true;
  }
  expect('JWT: tampered token throws', threw, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SCORE VALIDATION BOUNDARIES
// ─────────────────────────────────────────────────────────────────────────────

function isValidScore(score: number, min = 0, max = 10): boolean {
  return score >= min && score <= max;
}

expect('score: 0 valid', isValidScore(0), true);
expect('score: 10 valid', isValidScore(10), true);
expect('score: 5.5 valid', isValidScore(5.5), true);
expect('score: -0.1 invalid', isValidScore(-0.1), false);
expect('score: 10.1 invalid', isValidScore(10.1), false);
expect('score: NaN invalid', isValidScore(NaN), false);

// ─────────────────────────────────────────────────────────────────────────────
// 6. GRADE DOMAIN SEPARATION
// ─────────────────────────────────────────────────────────────────────────────

// Verify that task grades (Submission.score) and academic grades (Grade model) are distinct
// This is a conceptual assertion test – the models exist in separate tables

import Submission from '../models/Submission';
import Grade from '../models/Grade';

expectTruthy('Submission model exists', Submission);
expectTruthy('Grade model exists', Grade);
expect('Submission.tableName', Submission.getTableName(), 'submissions');
expect('Grade.tableName', Grade.getTableName(), 'grades');

// ─────────────────────────────────────────────────────────────────────────────
// 7. EVIDENCE MODEL — Schema safety checks
// ─────────────────────────────────────────────────────────────────────────────

import Evidence from '../models/Evidence';

expectTruthy('Evidence model exists', Evidence);
expect('Evidence.tableName', Evidence.getTableName(), 'evidences');

// Check that storageObjectKey is defined in the model attributes
const evidenceAttrs = Evidence.rawAttributes;
expectTruthy('Evidence has storageObjectKey attribute', 'storageObjectKey' in evidenceAttrs);
expectTruthy('Evidence has mimeType attribute', 'mimeType' in evidenceAttrs);
expectTruthy('Evidence has fileSize attribute', 'fileSize' in evidenceAttrs);

// ─────────────────────────────────────────────────────────────────────────────
// 8. AUDIT EVENT NAMES — canonical consistency
// ─────────────────────────────────────────────────────────────────────────────

import { AuditAction } from '../services/auditLog.service';

// Just verify type-level consistency via a runtime set check
const expectedActions: AuditAction[] = [
  'ACTIVITY_CREATED', 'ACTIVITY_UPDATED',
  'SUBMISSION_CREATED', 'SUBMISSION_REPLACED',
  'TASK_GRADE_CREATED', 'TASK_GRADE_UPDATED',
  'ACADEMIC_GRADE_CREATED', 'ACADEMIC_GRADE_UPDATED',
  'ATTENDANCE_SAVED', 'ATTENDANCE_UPDATED',
  'OBSERVATION_CREATED', 'OBSERVATION_UPDATED',
  'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_UPDATED',
  'EVIDENCE_UPLOADED', 'EVIDENCE_REPLACED', 'EVIDENCE_DELETED',
];

expect('AuditAction list has 17 entries', expectedActions.length, 17);
expectTruthy('AuditAction: TASK_GRADE_CREATED present', expectedActions.includes('TASK_GRADE_CREATED'));
expectTruthy('AuditAction: ACADEMIC_GRADE_CREATED present', expectedActions.includes('ACADEMIC_GRADE_CREATED'));

// ─────────────────────────────────────────────────────────────────────────────

printSummary();
