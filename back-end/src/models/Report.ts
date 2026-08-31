import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Report extends Model {
  public id!: number;
  public title!: string;
  public type!: 'ACADEMIC' | 'ATTENDANCE' | 'CERTIFICATE' | 'CUSTOM';
  public generatedById!: number;
  public fileUrl!: string | null;
  public parameters!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('ACADEMIC', 'ATTENDANCE', 'CERTIFICATE', 'CUSTOM'),
      allowNull: false,
      defaultValue: 'ACADEMIC',
    },
    generatedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parameters: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reports',
  }
);

export default Report;
