import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StudentAttributes {
  id: number;
  userId: number;
  studentCode: string;
  birthDate: string;
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  enrolledAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type StudentCreationAttributes = Optional<StudentAttributes, 'id' | 'enrolledAt'>;

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  declare id: number;
  declare userId: number;
  declare studentCode: string;
  declare birthDate: string;
  declare phone: string;
  declare address: string;
  declare guardianName: string;
  declare guardianPhone: string;
  declare enrolledAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare user?: unknown;
  declare enrollments?: unknown[];
}

Student.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    studentCode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    birthDate: { type: DataTypes.DATEONLY, allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
    address: { type: DataTypes.STRING(300), allowNull: false, defaultValue: '' },
    guardianName: { type: DataTypes.STRING(150), allowNull: false, defaultValue: '' },
    guardianPhone: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
    enrolledAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'Student', tableName: 'students' }
);

export default Student;
