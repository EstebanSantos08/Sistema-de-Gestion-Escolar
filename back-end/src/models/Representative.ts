import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Representative extends Model {
  public id!: number;
  public userId!: number;
  public relationship!: string; // 'padre' | 'madre' | 'tutor' | 'representante_legal'
  public phone!: string;
  public occupation!: string;
  public address!: string;
  public primaryContact!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Representative.init(
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
    relationship: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'representante_legal',
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryContact: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'representatives',
  }
);

export default Representative;
