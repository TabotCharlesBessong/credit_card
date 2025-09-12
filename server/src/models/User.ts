import { DataTypes, Model, Sequelize } from 'sequelize';
import * as yup from 'yup';

class User extends Model {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string; // Hashed password
  public isVerified!: boolean; // For account activation

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUser = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      firstName: {
        type: new DataTypes.STRING(128),
        allowNull: false,
      },
      lastName: {
        type: new DataTypes.STRING(128),
        allowNull: false,
      },
      email: {
        type: new DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      password: {
        type: new DataTypes.STRING(128),
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'users',
      sequelize, // passing the `sequelize` instance is required
    }
  );
};

export const associateUser = (sequelize: Sequelize) => {
  // Define associations here if any, e.g., User.hasMany(SomeOtherModel)
  // const { SomeOtherModel } = sequelize.models;
  // User.hasMany(SomeOtherModel, { foreignKey: 'userId', as: 'someOtherModels' });
};

export const userSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default User;

