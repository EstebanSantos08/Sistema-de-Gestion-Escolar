import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Activity extends Model {
  public id!: number;
  public courseId!: number;
  public title!: string;
  public description!: string | null;
  public dueDate!: string | Date | null;
  public type!: 'tarea' | 'examen' | 'taller' | 'proyecto' | 'deber';
  public status!: 'programada' | 'en_curso' | 'completada';
  public maxScore!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Activity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('tarea', 'examen', 'taller', 'proyecto', 'deber'),
      allowNull: false,
      defaultValue: 'deber',
    },
    status: {
      type: DataTypes.ENUM('programada', 'en_curso', 'completada'),
      allowNull: false,
      defaultValue: 'en_curso',
    },
    maxScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 10.0,
    },
  },
  {
    sequelize,
    tableName: 'activities',
  }
);

export default Activity;
