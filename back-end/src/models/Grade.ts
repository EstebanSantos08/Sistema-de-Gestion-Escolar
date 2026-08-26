import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface GradeAttributes {
  id: number;
  enrollmentId: number;
  gradeType: string;
  score: number;
  weight: number;
  comments: string;
  gradedAt: Date;
  gradedById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type GradeCreationAttributes = Optional<GradeAttributes, 'id' | 'comments' | 'gradedAt' | 'weight'>;

class Grade extends Model<GradeAttributes, GradeCreationAttributes> implements GradeAttributes {
  declare id: number;
  declare enrollmentId: number;
  declare gradeType: string;
  declare score: number;
  declare weight: number;
  declare comments: string;
  declare gradedAt: Date;
  declare gradedById: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare enrollment?: unknown;
}

Grade.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    enrollmentId: { type: DataTypes.INTEGER, allowNull: false },
    gradeType: { type: DataTypes.STRING(50), allowNull: false },
    score: { type: DataTypes.FLOAT, allowNull: false },
    weight: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1.0 },
    comments: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    gradedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    gradedById: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Grade',
    tableName: 'grades',
  }
);

export default Grade;
