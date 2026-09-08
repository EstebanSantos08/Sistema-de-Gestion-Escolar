/**
 * Supabase Storage backend service.
 *
 * Architecture:
 *  - Bucket is PRIVATE – signed URLs are generated per-request, never persisted.
 *  - Service-role key stays on the server; Vite / frontend never receives it.
 *  - Object path is stable and stored in PostgreSQL (evidences.storageObjectKey).
 *  - MIME type is validated server-side from the file buffer (magic bytes),
 *    never from the file extension alone.
 *  - Max file size: 1 048 576 bytes (1 MiB).
 *  - Allowed types: image/jpeg, image/png, image/webp, application/pdf.
 *
 * Replacement upload protocol:
 *  1. Upload new object.
 *  2. Validate storage success.
 *  3. Persist new metadata in PostgreSQL.
 *  4. Preserve old object until database success is confirmed.
 *  5. Remove old object ONLY after successful replacement.
 *  6. Log compensation failures for reconciliation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Constants ─────────────────────────────────────────────────────────────────

export const MAX_FILE_BYTES = 1_048_576; // 1 MiB
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
export const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'evidences';

// ── Magic-byte MIME detection ─────────────────────────────────────────────────

/**
 * Detect MIME type from file buffer using magic bytes.
 * Extension is NOT trusted.
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4e && buffer[3] === 0x47
  ) return 'image/png';

  // WebP: RIFF????WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 &&
    buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 &&
    buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';

  // PDF: %PDF
  if (
    buffer[0] === 0x25 && buffer[1] === 0x50 &&
    buffer[2] === 0x44 && buffer[3] === 0x46
  ) return 'application/pdf';

  return null;
}

export interface MimeValidationResult {
  valid: boolean;
  detectedMime: string | null;
  error?: string;
}

export function validateMimeType(buffer: Buffer): MimeValidationResult {
  if (buffer.length > MAX_FILE_BYTES) {
    return {
      valid: false,
      detectedMime: null,
      error: `El archivo supera el tamaño máximo de ${MAX_FILE_BYTES} bytes`,
    };
  }

  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      detectedMime: null,
      error: 'No se pudo detectar el tipo de archivo. Solo se permiten imágenes (JPEG, PNG, WebP) y PDF.',
    };
  }

  if (!ALLOWED_MIME_TYPES.has(detectedMime)) {
    return {
      valid: false,
      detectedMime,
      error: `Tipo de archivo no permitido: ${detectedMime}. Solo se permiten imágenes y PDF.`,
    };
  }

  return { valid: true, detectedMime };
}

// ── Object-path generation ────────────────────────────────────────────────────

/**
 * Generate a deterministic, stable storage object key.
 * Format: evidence/{courseId}/{activityId}/{studentId}/{evidenceId}_{timestamp}.{ext}
 *
 * The path is stored in PostgreSQL; signed URLs are generated on demand.
 */
export function buildObjectKey(params: {
  courseId: number;
  activityId: number;
  studentId: number;
  evidenceId?: number;
  mimeType: string;
}): string {
  const ext =
    params.mimeType === 'application/pdf' ? 'pdf' :
    params.mimeType === 'image/jpeg' ? 'jpg' :
    params.mimeType === 'image/png' ? 'png' :
    params.mimeType === 'image/webp' ? 'webp' : 'bin';

  const ts = Date.now();
  const id = params.evidenceId ?? 'new';
  return `evidence/${params.courseId}/${params.activityId}/${params.studentId}/${id}_${ts}.${ext}`;
}

// ── Supabase client (lazy, singleton) ────────────────────────────────────────

let _client: SupabaseClient | null = null;

function getStorageClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Storage operations.'
    );
  }

  // Auth is disabled for the service client – it uses the service-role key directly.
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// ── Storage operations ────────────────────────────────────────────────────────

export interface UploadResult {
  objectKey: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a file buffer to the private bucket.
 * Returns the stable object key to be stored in PostgreSQL.
 */
export async function uploadEvidence(
  buffer: Buffer,
  mimeType: string,
  objectKey: string,
): Promise<UploadResult> {
  const client = getStorageClient();
  const { error } = await client.storage
    .from(BUCKET)
    .upload(objectKey, buffer, {
      contentType: mimeType,
      upsert: false, // force new upload; replacement is handled explicitly
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { objectKey, size: buffer.length, mimeType };
}

/**
 * Generate a short-lived signed URL for authorized download.
 * NEVER store the returned URL – generate fresh per authorized request.
 */
export async function generateSignedUrl(objectKey: string): Promise<string> {
  const client = getStorageClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(objectKey, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message ?? 'unknown'}`);
  }

  return data.signedUrl;
}

/**
 * Delete a storage object.
 * Used ONLY after a successful replacement has been confirmed in PostgreSQL.
 * Failures are logged for reconciliation – they do not roll back the DB record.
 */
export async function deleteStorageObject(objectKey: string): Promise<void> {
  const client = getStorageClient();
  const { error } = await client.storage.from(BUCKET).remove([objectKey]);
  if (error) {
    // Log for reconciliation – do NOT re-throw; DB state is already committed.
    console.error(
      `[STORAGE_COMPENSATION] Failed to delete old object "${objectKey}": ${error.message}. Manual cleanup required.`
    );
  }
}

/** Check if the Supabase Storage config is present (for health checks) */
export function isStorageConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
