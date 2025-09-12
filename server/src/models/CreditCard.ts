import { DataTypes, Model, Sequelize } from 'sequelize';
import * as yup from 'yup';
import { CardStatus, CardType } from '../constants/enums'; // Import enums
import User from './User';

class CreditCard extends Model {
  public id!: number;
  public userId!: number;
  public cardNumber!: string; // Encrypted
  public cardHolderName!: string;
  public expiryMonth!: string;
  public expiryYear!: string;
  public creditLimit!: number;
  public currentBalance!: number;
  public status!: CardStatus;
  public cardType!: CardType; // Added for completeness

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: User;
}

export const initCreditCard = (sequelize: Sequelize) => {
  CreditCard.init(
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
      cardNumber: {
        type: new DataTypes.STRING(256), // Increased length for encryption
        allowNull: false,
        unique: true,
      },
      cardHolderName: {
        type: new DataTypes.STRING(256),
        allowNull: false,
      },
      expiryMonth: {
        type: new DataTypes.STRING(2),
        allowNull: false,
        validate: {
          is: /^(0[1-9]|1[0-2])$/, // MM format
        },
      },
      expiryYear: {
        type: new DataTypes.STRING(4),
        allowNull: false,
        validate: {
          is: /^(20)\d{2}$/, // YYYY format, starting from 20xx
        },
      },
      creditLimit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currentBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CardStatus)),
        allowNull: false,
        defaultValue: CardStatus.PENDING, // New cards are pending by default
      },
      cardType: {
        type: DataTypes.ENUM(...Object.values(CardType)),
        allowNull: false,
        defaultValue: CardType.VISA, // Default, can be updated based on card number
      },
    },
    {
      tableName: 'credit_cards',
      sequelize,
    }
  );
};

export const associateCreditCard = (sequelize: Sequelize) => {
  const { User, Transaction } = sequelize.models;
  CreditCard.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  CreditCard.hasMany(Transaction, { foreignKey: 'cardId', as: 'transactions' });
};

export const creditCardSchema = yup.object().shape({
  // userId: yup.number().required('User ID is required'), // userId is derived from the authenticated user
  cardNumber: yup.string().required('Card number is required').length(16, 'Card number must be 16 digits'), // Basic validation, actual validation after decryption
  // cardHolderName: yup.string().required('Card holder name is required'), // cardHolderName is derived from the authenticated user's name
  expiryMonth: yup.string().matches(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month (MM)').required('Expiry month is required'),
  expiryYear: yup.string().matches(/^(20)\d{2}$/, 'Invalid expiry year (YYYY)').required('Expiry year is required'),
  creditLimit: yup.number().min(0, 'Credit limit cannot be negative').required('Credit limit is required'),
  // currentBalance and status will be internally managed initially
});

export default CreditCard;
