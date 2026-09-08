import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import type Student from './Student';
import type Teacher from './Teacher';

export class Observation extends Model {
  public id!: number;
  public studentId!: number;
  public teacherId!: number;
  public title!: string;
  public description!: string;
  public type!: 'ACADEMIC' | 'BEHAVIORAL' | 'GENERAL';
  public visibility!: 'ESTUDIANTE_Y_PADRES' | 'SOLO_ESTUDIANTE' | 'SOLO_DOCENTE';
  public date!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (populated by include)
  public student?: Student;
  public teacher?: Teacher;
}

Observation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('ACADEMIC', 'BEHAVIORAL', 'GENERAL'),
      allowNull: false,
      defaultValue: 'GENERAL',
    },
    visibility: {
      type: DataTypes.ENUM('ESTUDIANTE_Y_PADRES', 'SOLO_ESTUDIANTE', 'SOLO_DOCENTE'),
      allowNull: false,
      defaultValue: 'ESTUDIANTE_Y_PADRES',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'observations',
  }
);

export default Observation;
