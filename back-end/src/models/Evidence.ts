import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Evidence extends Model {
  public id!: number;
  public submissionId!: number;
  public type!: 'imagen' | 'video' | 'documento' | 'audio';
  public fileUrl!: string;
  public fileName!: string;
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
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
