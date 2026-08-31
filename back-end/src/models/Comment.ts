import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Comment extends Model {
  public id!: number;
  public submissionId!: number;
  public authorId!: number;
  public authorRole!: 'admin' | 'teacher' | 'parent' | 'student';
  public content!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'submissions', key: 'id' },
      onDelete: 'CASCADE',
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    authorRole: {
      type: DataTypes.ENUM('admin', 'teacher', 'parent', 'student'),
      allowNull: false,
      defaultValue: 'teacher',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
  }
);

export default Comment;
