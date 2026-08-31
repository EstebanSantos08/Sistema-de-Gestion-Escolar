import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class AuditLog extends Model {
  public id!: number;
  public userId!: number | null;
  public action!: string;
  public resource!: string;
  public resourceId!: number | null;
  public details!: string | null;
  public ipAddress!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
  }
);

export default AuditLog;
