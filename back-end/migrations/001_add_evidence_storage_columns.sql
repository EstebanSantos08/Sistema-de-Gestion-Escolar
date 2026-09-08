-- ============================================================
-- Migration 001: Add Evidence storage columns
-- Status: PREPARED — NOT APPLIED
-- ============================================================
-- Purpose:
--   Add storageObjectKey, mimeType, and fileSize to the evidences table.
--   The fileUrl column is preserved for backward compatibility.
--
-- PREFLIGHT QUERIES (run before applying):
-- ============================================================

-- 1. Check for duplicate/orphan evidences (should be 0)
SELECT COUNT(*) AS orphan_evidences
FROM evidences e
WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.id = e."submissionId");

-- 2. Check existing fileUrl distribution
SELECT COUNT(*) AS total, COUNT("fileUrl") AS has_file_url FROM evidences;

-- 3. Check if columns already exist (safe guard)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'evidences'
  AND column_name IN ('storageObjectKey', 'mimeType', 'fileSize');

-- ============================================================
-- MIGRATION (apply after preflight passes)
-- ============================================================
BEGIN;

ALTER TABLE "evidences"
  ADD COLUMN IF NOT EXISTS "storageObjectKey" VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS "mimeType"         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "fileSize"         INTEGER;

-- Backfill storageObjectKey from existing fileUrl
UPDATE "evidences"
SET "storageObjectKey" = "fileUrl"
WHERE "storageObjectKey" IS NULL;

-- After verifying data:
-- ALTER TABLE "evidences" ALTER COLUMN "storageObjectKey" SET NOT NULL;

COMMIT;

-- ============================================================
-- ROLLBACK (lossless – only removes new columns)
-- ============================================================
-- BEGIN;
-- ALTER TABLE "evidences"
--   DROP COLUMN IF EXISTS "storageObjectKey",
--   DROP COLUMN IF EXISTS "mimeType",
--   DROP COLUMN IF EXISTS "fileSize";
-- COMMIT;

-- ============================================================
-- AFFECTED DATA ESTIMATE
-- Run to estimate before applying:
-- SELECT COUNT(*) FROM evidences;
-- ============================================================
