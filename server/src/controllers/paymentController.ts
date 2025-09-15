import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import { getTransactionsByCardId } from '../services/paymentService';
import logger from '../config/logger';
import * as yup from 'yup';
import { sendEmail } from './authController';
import CreditCard from '../models/CreditCard';
import User from '../models/User';
import { TransactionStatus } from '../constants/enums';
import { decryptCardNumber } from './cardController';
import Decimal from 'decimal.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Yup schemas for validation
const topUpSchema = yup.object().shape({
  cardId: yup.number().required('Card ID is required'),
  amount: yup.number().min(0.01, 'Amount must be positive').required('Amount is required'),
  description: yup.string().required('Description is required'),
  recipientDetails: yup.string().required('Recipient details are required'),
});

const sendMoneySchema = yup.object().shape({
  cardId: yup.number().required('Card ID is required'),
  amount: yup.number().min(0.01, 'Amount must be positive').required('Amount is required'),
  description: yup.string().required('Description is required'),
  recipientDetails: yup.string().required('Recipient details are required'), // e.g., mobile number, bank account number
});

const cardPaymentSchema = yup.object().shape({
  cardId: yup.number().required('Card ID is required'),
  amount: yup.number().min(0.01, 'Amount must be positive').required('Amount is required'),
  description: yup.string().required('Description is required'),
  merchant: yup.string().required('Merchant is required'),
});

const sendTransactionEmail = async (userId: number, cardId: number, transaction: any, status: TransactionStatus, message: string) => {
  try {
    const user = await User.findByPk(userId);
    const creditCard = await CreditCard.findByPk(cardId);

    if (user && creditCard && transaction) {
      await sendEmail(
        user.email,
        `Transaction ${status}`,
        "transaction_status_email",
        {
          USER_NAME: user.firstName,
          AMOUNT: new Decimal(transaction.amount).toFixed(2),
          CURRENCY: "USD", // Or dynamically fetch currency
          TRANSACTION_TYPE: transaction.type.toUpperCase(),
          CARD_TYPE: creditCard.cardType,
          LAST_FOUR_DIGITS: decryptCardNumber(creditCard.cardNumber).slice(-4),
          TRANSACTION_STATUS: status.toUpperCase(),
          DESCRIPTION: transaction.description,
          CURRENT_BALANCE: new Decimal(creditCard.currentBalance).toFixed(2),
          APP_NAME: "Credit Card App",
          YEAR: new Date().getFullYear().toString(),
        }
      );
    }
  } catch (emailError) {
    logger.error("Error sending transaction email:", emailError);
  }
};

export const topUpMobileMoney = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await topUpSchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, recipientDetails } = req.body;

    const result = await paymentService.topUpMobileMoney(amount, cardId, description, recipientDetails);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error topping up Mobile Money:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const topUpOrangeMoney = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await topUpSchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, recipientDetails } = req.body;

    const result = await paymentService.topUpOrangeMoney(amount, cardId, description, recipientDetails);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error topping up Orange Money:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const topUpBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await topUpSchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, recipientDetails } = req.body;

    const result = await paymentService.topUpBankAccount(amount, cardId, description, recipientDetails);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error topping up Bank Account:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendToMobileMoney = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await sendMoneySchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, recipientDetails } = req.body;

    const result = await paymentService.sendToMobileMoney(amount, cardId, description,recipientDetails);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error sending money to Mobile Money:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendToOrangeMoney = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await sendMoneySchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, recipientDetails } = req.body;

    const result = await paymentService.sendToOrangeMoney(amount, cardId, description, recipientDetails);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error sending money to Orange Money:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendToBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await sendMoneySchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, recipientDetails } = req.body;

    const result = await paymentService.sendToBankAccount(amount, cardId, description, recipientDetails);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error sending money to Bank Account:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const processCardPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    await cardPaymentSchema.validate(req.body, { abortEarly: false });
    const { cardId, amount, description, merchant } = req.body;

    const result = await paymentService.processCardPayment(amount, cardId, description, merchant);

    await sendTransactionEmail(req.user.id, cardId, result.transaction, result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED, result.message);

    if (result.success) {
      return res.status(200).json({ message: result.message, transaction: result.transaction });
    } else {
      return res.status(400).json({ message: result.message, transaction: result.transaction });
    }
  } catch (error: any) {
    logger.error("Error processing card payment:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const fetchCardTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const { cardId } = req.params;
    const userId = req.user.id;

    // Verify that the card belongs to the authenticated user
    const creditCard = await CreditCard.findOne({ where: { id: cardId, userId } });
    if (!creditCard) {
      return res.status(404).json({ message: 'Credit card not found or does not belong to user.' });
    }

    const transactions = await getTransactionsByCardId(Number(cardId));

    logger.info(`Fetched transactions for card ${cardId} for user ${req.user.email}.`);
    res.status(200).json(transactions);
  } catch (error: any) {
    logger.error(`Error fetching transactions for card ${req.params.cardId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};