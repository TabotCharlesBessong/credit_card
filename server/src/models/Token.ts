import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './User';

class Token extends Model {
  public id!: number;
  public userId!: number;
  public token!: string;
  public type!: 'email_verification' | 'password_reset';
  public expiresAt!: Date;

  public user?: User; // Add this line for the association

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initToken = (sequelize: Sequelize) => {
  Token.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: User, // This is a reference to the User model
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      token: {
        type: new DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      type: {
        type: new DataTypes.ENUM('email_verification', 'password_reset'),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'tokens',
      sequelize, // passing the `sequelize` instance is required
    }
  );
};

export const associateToken = (sequelize: Sequelize) => {
  const { User } = sequelize.models;
  User.hasMany(Token, { foreignKey: 'userId', as: 'tokens' });
  Token.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

export default Token;
