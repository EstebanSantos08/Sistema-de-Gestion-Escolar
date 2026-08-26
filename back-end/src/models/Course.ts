import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CourseAttributes {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  period: string;
  teacherId: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type CourseCreationAttributes = Optional<CourseAttributes, 'id' | 'credits' | 'active' | 'description'>;

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare description: string;
  declare credits: number;
  declare period: string;
  declare teacherId: number;
  declare active: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare teacher?: unknown;
  declare enrollments?: unknown[];
}

Course.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    period: { type: DataTypes.STRING(20), allowNull: false },
    teacherId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'teachers', key: 'id' } },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'Course', tableName: 'courses' }
);

export default Course;
