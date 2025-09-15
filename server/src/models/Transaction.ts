import { DataTypes, Model, Sequelize } from 'sequelize';
import * as yup from 'yup';
import { TransactionType, TransactionStatus } from '../constants/enums'; // Import enums
import CreditCard from './CreditCard';

class Transaction extends Model {
  public id!: number;
  public cardId!: number;
  public amount!: number;
  public type!: TransactionType;
  public status!: TransactionStatus;
  public description!: string;
  public merchant!: string | null;
  public transactionDate!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public creditCard?: CreditCard;
}

export const initTransaction = (sequelize: Sequelize) => {
  Transaction.init(
    {
      id: {
        type: process.env.NODE_ENV === 'test' ? DataTypes.INTEGER : DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      cardId: {
        type: process.env.NODE_ENV === 'test' ? DataTypes.INTEGER : DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: CreditCard, // This is a reference to the CreditCard model
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0.01, // Transactions must have a positive amount
        },
      },
      type: {
        type: DataTypes.ENUM(...Object.values(TransactionType)),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TransactionStatus)),
        allowNull: false,
        defaultValue: TransactionStatus.PENDING,
      },
      description: {
        type: new DataTypes.STRING(256),
        allowNull: false,
      },
      merchant: {
        type: new DataTypes.STRING(256),
        allowNull: true,
      },
      transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'transactions',
      sequelize,
    }
  );
};

export const associateTransaction = (sequelize: Sequelize) => {
  const { CreditCard } = sequelize.models;
  Transaction.belongsTo(CreditCard, { foreignKey: 'cardId', as: 'creditCard' });
};

export const transactionSchema = yup.object().shape({
  cardId: yup.number().required('Card ID is required'),
  amount: yup.number().min(0.01, 'Amount must be positive').required('Amount is required'),
  type: yup.string().oneOf(Object.values(TransactionType), 'Invalid transaction type').required('Transaction type is required'),
  description: yup.string().required('Description is required'),
  merchant: yup.string().nullable(),
});

export default Transaction;
