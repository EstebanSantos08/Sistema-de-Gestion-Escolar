import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Attendance extends Model {
  public id!: number;
  public studentId!: number;
  public courseId!: number;
  public date!: string;
  public status!: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  public remarks!: string | null;
  public registeredById!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
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
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
      allowNull: false,
      defaultValue: 'PRESENT',
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registeredById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'attendances',
  }
);

export default Attendance;
