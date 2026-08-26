import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TeacherAttributes {
  id: number;
  userId: number;
  teacherCode: string;
  specialization: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type TeacherCreationAttributes = Optional<TeacherAttributes, 'id'>;

class Teacher extends Model<TeacherAttributes, TeacherCreationAttributes> implements TeacherAttributes {
  declare id: number;
  declare userId: number;
  declare teacherCode: string;
  declare specialization: string;
  declare phone: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare user?: unknown;
  declare courses?: unknown[];
}

Teacher.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    teacherCode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    specialization: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    phone: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
  },
  { sequelize, modelName: 'Teacher', tableName: 'teachers' }
);

export default Teacher;
