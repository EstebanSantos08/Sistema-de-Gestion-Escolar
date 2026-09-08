/**
 * AuditLog Service — append-only institutional history.
 *
 * Rules:
 *  - Actor identity ALWAYS comes from authenticated JWT context (req.user),
 *    never from the request body.
 *  - Business DB write + AuditLog share the same Sequelize transaction when
 *    both are PostgreSQL operations.
 *  - Passwords, JWTs, Storage credentials, file contents, and signed URLs
 *    must NEVER appear in details.
 */

import { Transaction } from 'sequelize';
import AuditLog from '../models/AuditLog';

// ── Canonical event names ─────────────────────────────────────────────────────

export type AuditAction =
  // Activity
  | 'ACTIVITY_CREATED'
  | 'ACTIVITY_UPDATED'
  // Submission
  | 'SUBMISSION_CREATED'
  | 'SUBMISSION_REPLACED'
  // Task grade (Submission.score / Submission.teacherFeedback)
  | 'TASK_GRADE_CREATED'
  | 'TASK_GRADE_UPDATED'
  // Academic grade (Grade model)
  | 'ACADEMIC_GRADE_CREATED'
  | 'ACADEMIC_GRADE_UPDATED'
  // Attendance
  | 'ATTENDANCE_SAVED'
  | 'ATTENDANCE_UPDATED'
  // Observation
  | 'OBSERVATION_CREATED'
  | 'OBSERVATION_UPDATED'
  // Announcement
  | 'ANNOUNCEMENT_CREATED'
  | 'ANNOUNCEMENT_UPDATED'
  // Evidence (Storage)
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_REPLACED'
  | 'EVIDENCE_DELETED';

export interface AuditDetails {
  /** Actor role derived from JWT – NOT from request body */
  actorRole?: string;
  /** Related student id (if applicable) */
  studentId?: number;
  studentName?: string;
  /** Related course id (if applicable) */
  courseId?: number;
  courseName?: string;
  /** Related activity id (if applicable) */
  activityId?: number;
  activityTitle?: string;
  /** Grade category: 'task' | 'academic' */
  gradeCategory?: 'task' | 'academic';
  /** For update events: old value(s) – no secrets */
  oldValues?: Record<string, unknown>;
  /** For update events: new value(s) – no secrets */
  newValues?: Record<string, unknown>;
  /** Any other safe context */
  [key: string]: unknown;
}

export interface CreateAuditOptions {
  /** Authenticated user id from JWT */
  actorUserId: number;
  /** Canonical action name */
  action: AuditAction;
  /** Sequelize model / resource name */
  resource: string;
  /** PK of the affected row */
  resourceId?: number;
  /** Structured, safe context – no credentials */
  details?: AuditDetails;
  /** IP address for security traceability */
  ipAddress?: string;
  /** Shared transaction – required when the business write is in the same tx */
  transaction?: Transaction;
}

/**
 * Append a single audit log entry.
 *
 * This function is intentionally fire-and-forget safe: it throws on actual
 * DB errors so callers inside transactions can handle rollback properly.
 */
export async function createAuditLog(opts: CreateAuditOptions): Promise<AuditLog> {
  const {
    actorUserId,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    transaction,
  } = opts;

  // Stringify details safely – reject any key that looks like a credential
  const safeDetails = sanitizeDetails(details);

  return AuditLog.create(
    {
      userId: actorUserId,
      action,
      resource,
      resourceId: resourceId ?? null,
      details: safeDetails ? JSON.stringify(safeDetails) : null,
      ipAddress: ipAddress ?? null,
    },
    { transaction }
  );
}

/**
 * Strip potentially sensitive keys from the details object before persisting.
 * This is a defence-in-depth measure – callers should not pass secrets at all.
 */
function sanitizeDetails(
  details?: AuditDetails
): AuditDetails | null {
  if (!details) return null;

  const FORBIDDEN_KEYS = new Set([
    'password', 'passwordHash', 'jwt', 'token', 'secret',
    'serviceRoleKey', 'anonKey', 'signedUrl', 'fileContent',
    'authorization', 'apiKey',
  ]);

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      cleaned[key] = sanitizeDetails(value as AuditDetails);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as AuditDetails;
}

/** Helper: extract IP from Express request (handles proxies) */
export function extractIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first?.trim() ?? req.ip ?? 'unknown';
  }
  return req.ip ?? 'unknown';
}
