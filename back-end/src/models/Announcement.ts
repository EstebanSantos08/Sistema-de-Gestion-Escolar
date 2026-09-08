import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import type Course from './Course';
import type User from './User';

export class Announcement extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public targetRole!: 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';
  public courseId!: number | null;
  public authorId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (populated by include)
  public course?: Course;
  public author?: User;
}

Announcement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetRole: {
      type: DataTypes.ENUM('ALL', 'TEACHER', 'STUDENT', 'PARENT'),
      allowNull: false,
      defaultValue: 'ALL',
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    authorId: {
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
    tableName: 'announcements',
  }
);

export default Announcement;
