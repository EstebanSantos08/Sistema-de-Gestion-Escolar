-- ============================================================
-- Migration 002: Uniqueness constraints
-- Status: PREPARED — NOT APPLIED
-- ============================================================
-- Proposed constraints from architecture review:
--
--   grades:        UNIQUE (enrollmentId, gradeType)
--   submissions:   UNIQUE (activityId, studentId)
--   attendances:   UNIQUE (studentId, courseId, date)
--   enrollments:   UNIQUE (studentId, courseId, period)
--   students:      UNIQUE (userId)  — already on Teacher via teacherCode
--   audit_logs:    Index on (action, createdAt) + JSONB index if applicable
--
-- ============================================================

-- ============================================================
-- PREFLIGHT DUPLICATE QUERIES
-- Run these BEFORE applying. Each must return 0 rows to proceed.
-- ============================================================

-- grades duplicates
SELECT "enrollmentId", "gradeType", COUNT(*) AS cnt
FROM grades
GROUP BY "enrollmentId", "gradeType"
HAVING COUNT(*) > 1;

-- submissions duplicates
SELECT "activityId", "studentId", COUNT(*) AS cnt
FROM submissions
GROUP BY "activityId", "studentId"
HAVING COUNT(*) > 1;

-- attendances duplicates
SELECT "studentId", "courseId", "date", COUNT(*) AS cnt
FROM attendances
GROUP BY "studentId", "courseId", "date"
HAVING COUNT(*) > 1;

-- enrollments duplicates
SELECT "studentId", "courseId", "period", COUNT(*) AS cnt
FROM enrollments
GROUP BY "studentId", "courseId", "period"
HAVING COUNT(*) > 1;

-- students userId duplicates
SELECT "userId", COUNT(*) AS cnt
FROM students
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- ============================================================
-- ORPHAN CHECKS
-- ============================================================

-- Submissions referencing non-existent activities
SELECT COUNT(*) AS orphan_submissions
FROM submissions s
WHERE NOT EXISTS (SELECT 1 FROM activities a WHERE a.id = s."activityId");

-- Grades referencing non-existent enrollments
SELECT COUNT(*) AS orphan_grades
FROM grades g
WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.id = g."enrollmentId");

-- Attendances referencing non-existent courses
SELECT COUNT(*) AS orphan_attendances
FROM attendances a
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = a."courseId");

-- ============================================================
-- MIGRATION (apply ONLY after ALL preflight queries return 0 rows)
-- ============================================================
BEGIN;

-- 1. grades uniqueness
ALTER TABLE "grades"
  ADD CONSTRAINT IF NOT EXISTS "grades_enrollmentId_gradeType_key"
  UNIQUE ("enrollmentId", "gradeType");

-- 2. submissions uniqueness (one submission per student per activity)
ALTER TABLE "submissions"
  ADD CONSTRAINT IF NOT EXISTS "submissions_activityId_studentId_key"
  UNIQUE ("activityId", "studentId");

-- 3. attendances uniqueness
ALTER TABLE "attendances"
  ADD CONSTRAINT IF NOT EXISTS "attendances_studentId_courseId_date_key"
  UNIQUE ("studentId", "courseId", "date");

-- 4. enrollments uniqueness
ALTER TABLE "enrollments"
  ADD CONSTRAINT IF NOT EXISTS "enrollments_studentId_courseId_period_key"
  UNIQUE ("studentId", "courseId", "period");

-- 5. Performance indexes for audit_logs
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_created"
  ON "audit_logs" ("action", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId_created"
  ON "audit_logs" ("userId", "createdAt" DESC);

-- GIN index on details for JSONB filtering (if PostgreSQL >= 12 and details is JSONB)
-- CREATE INDEX IF NOT EXISTS "idx_audit_logs_details_gin"
--   ON "audit_logs" USING GIN (("details"::jsonb));
-- NOTE: Requires altering details column type from TEXT to JSONB first.
-- Evaluate whether this is warranted by query volume.

COMMIT;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- BEGIN;
-- ALTER TABLE "grades"       DROP CONSTRAINT IF EXISTS "grades_enrollmentId_gradeType_key";
-- ALTER TABLE "submissions"  DROP CONSTRAINT IF EXISTS "submissions_activityId_studentId_key";
-- ALTER TABLE "attendances"  DROP CONSTRAINT IF EXISTS "attendances_studentId_courseId_date_key";
-- ALTER TABLE "enrollments"  DROP CONSTRAINT IF EXISTS "enrollments_studentId_courseId_period_key";
-- DROP INDEX IF EXISTS "idx_audit_logs_action_created";
-- DROP INDEX IF EXISTS "idx_audit_logs_userId_created";
-- COMMIT;
--
-- ROLLBACK LOSSLESS: Yes — dropping constraints and indexes does not affect data.
-- ============================================================
