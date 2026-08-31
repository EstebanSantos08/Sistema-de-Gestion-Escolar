import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Notification extends Model {
  public id!: number;
  public userId!: number;
  public title!: string;
  public message!: string;
  public type!: 'actividad' | 'comentario' | 'comunicado' | 'asistencia' | 'evaluacion';
  public read!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('actividad', 'comentario', 'comunicado', 'asistencia', 'evaluacion'),
      allowNull: false,
      defaultValue: 'actividad',
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
  }
);

export default Notification;
