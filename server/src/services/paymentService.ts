import logger from '../config/logger';
import { TransactionType, TransactionStatus } from '../constants/enums';
import CreditCard from '../models/CreditCard';
import Transaction from '../models/Transaction';
import { Decimal } from 'decimal.js'; // Import Decimal

// This service will simulate interactions with external payment gateways.
// In a real application, these would involve actual API calls to providers like Stripe, Mobile Money APIs, etc.

export const simulatePaymentGateway = async (
  type: TransactionType,
  amount: number,
  cardId: number,
  description: string,
  merchant?: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Simulating ${type} transaction for card ${cardId} with amount ${amount}.`);

  const creditCard = await CreditCard.findByPk(cardId);
  if (!creditCard) {
    return { success: false, message: 'Credit card not found.' };
  }

  let newBalance = new Decimal(creditCard.currentBalance); // Initialize as Decimal
  const transactionAmount = new Decimal(amount); // Convert amount to Decimal
  let transactionStatus = TransactionStatus.PENDING;

  try {
    // Simulate delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (!isSuccess) {
      transactionStatus = TransactionStatus.FAILED;
      throw new Error('Simulated payment failed.');
    }

    if (type === TransactionType.DEBIT || type === TransactionType.TRANSFER) {
      if (newBalance.minus(transactionAmount).lessThan(0)) {
        transactionStatus = TransactionStatus.FAILED;
        throw new Error('Insufficient funds or exceeding credit limit.');
      }
      newBalance = newBalance.minus(transactionAmount);
    } else if (type === TransactionType.CREDIT || type === TransactionType.TOP_UP) {
      newBalance = newBalance.plus(transactionAmount);
    }

    transactionStatus = TransactionStatus.COMPLETED;

    await creditCard.update({ currentBalance: newBalance.toFixed(2) }); // Convert back to number or string for DB

    const transaction = await Transaction.create({
      cardId,
      amount,
      type,
      status: transactionStatus,
      description,
      merchant: merchant || (type === TransactionType.DEBIT ? 'Simulated Merchant' : null),
    });

    logger.info(`Simulated ${type} transaction completed successfully for card ${cardId}. New balance: ${newBalance.toFixed(2)}`);
    return { success: true, message: 'Payment processed successfully.', transaction };
  } catch (error: any) {
    logger.error(`Simulated ${type} transaction failed for card ${cardId}: ${error.message}`);

    // Record failed transaction
    const transaction = await Transaction.create({
      cardId,
      amount,
      type,
      status: TransactionStatus.FAILED,
      description,
      merchant: merchant || (type === TransactionType.DEBIT ? 'Simulated Merchant' : null),
    });

    return { success: false, message: error.message, transaction };
  }
};

// Specific functions for different payment types
export const topUpMobileMoney = async (
  amount: number,
  cardId: number,
  description: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting Mobile Money top-up for card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TOP_UP, amount, cardId, description, 'Mobile Money');
};

export const topUpOrangeMoney = async (
  amount: number,
  cardId: number,
  description: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting Orange Money top-up for card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TOP_UP, amount, cardId, description, 'Orange Money');
};

export const topUpBankAccount = async (
  amount: number,
  cardId: number,
  description: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting Bank Account top-up for card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TOP_UP, amount, cardId, description, 'Bank Account');
};

export const sendToMobileMoney = async (
  amount: number,
  cardId: number,
  description: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Mobile Money from card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TRANSFER, amount, cardId, description, 'Mobile Money Transfer');
};

export const sendToOrangeMoney = async (
  amount: number,
  cardId: number,
  description: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Orange Money from card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TRANSFER, amount, cardId, description, 'Orange Money Transfer');
};

export const sendToBankAccount = async (
  amount: number,
  cardId: number,
  description: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Bank Account from card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TRANSFER, amount, cardId, description, 'Bank Account Transfer');
};

export const processCardPayment = async (
  amount: number,
  cardId: number,
  description: string,
  merchant: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting card payment for card ${cardId}, amount: ${amount} to ${merchant}`);
  return simulatePaymentGateway(TransactionType.DEBIT, amount, cardId, description, merchant);
};
