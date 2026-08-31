import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Submission extends Model {
  public id!: number;
  public activityId!: number;
  public studentId!: number;
  public representativeId!: number | null;
  public status!: 'pendiente' | 'en_proceso' | 'entregada' | 'en_revision' | 'completada' | 'devuelta';
  public submittedAt!: Date | null;
  public studentNotes!: string | null;
  public teacherFeedback!: string | null;
  public score!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Submission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    activityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'activities', key: 'id' },
      onDelete: 'CASCADE',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'students', key: 'id' },
      onDelete: 'CASCADE',
    },
    representativeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'representatives', key: 'id' },
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'entregada', 'en_revision', 'completada', 'devuelta'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    studentNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    teacherFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'submissions',
  }
);

export default Submission;
