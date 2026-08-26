import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EnrollmentAttributes {
  id: number;
  studentId: number;
  courseId: number;
  period: string;
  status: 'active' | 'withdrawn' | 'completed';
  enrolledAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type EnrollmentCreationAttributes = Optional<EnrollmentAttributes, 'id' | 'status' | 'enrolledAt'>;

class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
  declare id: number;
  declare studentId: number;
  declare courseId: number;
  declare period: string;
  declare status: 'active' | 'withdrawn' | 'completed';
  declare enrolledAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations (populated by include)
  declare student?: unknown;
  declare course?: unknown;
  declare grades?: unknown[];
}

Enrollment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    period: { type: DataTypes.STRING(20), allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'withdrawn', 'completed'),
      allowNull: false,
      defaultValue: 'active',
    },
    enrolledAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'enrollments',
  }
);

export default Enrollment;
