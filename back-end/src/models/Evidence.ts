/**
 * Evidence model.
 *
 * SCHEMA NOTE:
 * The existing `fileUrl` column was historically used to store a file path or URL.
 * With Supabase Storage, we need to store the stable STORAGE OBJECT KEY (not a signed URL).
 *
 * ⚠️  MIGRATION PENDING:
 * A new column `storageObjectKey` (VARCHAR 1000) has been added at the Sequelize level
 * so new code can write to it. The `fileUrl` column is preserved for backward compat
 * (existing data) and is also written with the same object key in new records.
 *
 * Proposed migration (NOT applied yet – requires preflight and approval):
 *   ALTER TABLE "evidences"
 *     ADD COLUMN IF NOT EXISTS "storageObjectKey" VARCHAR(1000),
 *     ADD COLUMN IF NOT EXISTS "mimeType" VARCHAR(100),
 *     ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
 *   UPDATE "evidences" SET "storageObjectKey" = "fileUrl" WHERE "storageObjectKey" IS NULL;
 *   -- After data verification:
 *   ALTER TABLE "evidences" ALTER COLUMN "storageObjectKey" SET NOT NULL;
 *
 * The `fileUrl` column should eventually be renamed to `storageObjectKey` or dropped.
 * See: migrations/002_add_evidence_storage_columns.sql
 */

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Evidence extends Model {
  public id!: number;
  public submissionId!: number;
  public type!: 'imagen' | 'video' | 'documento' | 'audio';
  /**
   * @deprecated Use `storageObjectKey` for new records.
   * Legacy column kept for backward compatibility.
   * For new records this is set to the same value as `storageObjectKey`.
   */
  public fileUrl!: string;
  /**
   * Stable Supabase Storage object key (path within the private bucket).
   * This is what gets stored in PostgreSQL.
   * Signed download URLs are generated on-demand and NEVER persisted.
   */
  public storageObjectKey!: string;
  public fileName!: string;
  public mimeType!: string | null;
  public fileSize!: number | null;
  public caption!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Evidence.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'submissions', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('imagen', 'video', 'documento', 'audio'),
      allowNull: false,
      defaultValue: 'imagen',
    },
    fileUrl: {
      // Legacy column – for new records, same value as storageObjectKey
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    storageObjectKey: {
      // New column for stable storage path – migration pending
      type: DataTypes.STRING(1000),
      allowNull: true, // Nullable until migration runs; new writes always set this
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      // Detected MIME type from server-side magic-byte validation – migration pending
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fileSize: {
      // Size in bytes – migration pending
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'evidences',
  }
);

export default Evidence;
