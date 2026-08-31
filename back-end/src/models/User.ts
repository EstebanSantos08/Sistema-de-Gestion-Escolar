import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'active'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: 'admin' | 'teacher' | 'student' | 'parent';
  declare active: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  toSafeObject() {
    const { password: _password, ...safe } = this.toJSON() as UserAttributes;
    return safe;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(200), allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'),
      allowNull: false,
      defaultValue: 'student',
    },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'User', tableName: 'users' }
);

export default User;
