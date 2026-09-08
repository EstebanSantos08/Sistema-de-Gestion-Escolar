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

-- 1. grades uniqueness (enrollmentId, gradeType)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.conname = 'grades_enrollmentId_gradeType_key'
      AND rel.relname = 'grades'
  ) THEN
    ALTER TABLE "grades"
      ADD CONSTRAINT "grades_enrollmentId_gradeType_key"
      UNIQUE ("enrollmentId", "gradeType");
  END IF;
END $$;

-- 2. submissions uniqueness (one submission per student per activity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.conname = 'submissions_activityId_studentId_key'
      AND rel.relname = 'submissions'
  ) THEN
    ALTER TABLE "submissions"
      ADD CONSTRAINT "submissions_activityId_studentId_key"
      UNIQUE ("activityId", "studentId");
  END IF;
END $$;

-- 3. attendances uniqueness (studentId, courseId, date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.conname = 'attendances_studentId_courseId_date_key'
      AND rel.relname = 'attendances'
  ) THEN
    ALTER TABLE "attendances"
      ADD CONSTRAINT "attendances_studentId_courseId_date_key"
      UNIQUE ("studentId", "courseId", "date");
  END IF;
END $$;

-- 4. enrollments uniqueness (studentId, courseId, period)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.conname = 'enrollments_studentId_courseId_period_key'
      AND rel.relname = 'enrollments'
  ) THEN
    ALTER TABLE "enrollments"
      ADD CONSTRAINT "enrollments_studentId_courseId_period_key"
      UNIQUE ("studentId", "courseId", "period");
  END IF;
END $$;

-- 5. Performance indexes for audit_logs
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_created"
  ON "audit_logs" ("action", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId_created"
  ON "audit_logs" ("userId", "createdAt" DESC);

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
