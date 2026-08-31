import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Observation extends Model {
  public id!: number;
  public studentId!: number;
  public teacherId!: number;
  public title!: string;
  public description!: string;
  public type!: 'ACADEMIC' | 'BEHAVIORAL' | 'GENERAL';
  public date!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
