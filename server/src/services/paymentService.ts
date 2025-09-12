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
  recipientDetails?: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Simulating ${type} transaction for card ${cardId} with amount ${amount}.`);

  const creditCard = await CreditCard.findByPk(cardId);
  if (!creditCard) {
    return { success: false, message: 'Credit card not found.' };
  }

  let newBalance = new Decimal(creditCard.currentBalance); // Initialize as Decimal
  let transactionAmount = new Decimal(amount); // Convert amount to Decimal
  let transactionStatus = TransactionStatus.PENDING;
  let chargeAmount = new Decimal(0);

  // Apply transaction charges (2-5%) for non-top-up transactions
  if (type !== TransactionType.TOP_UP) {
    const chargeRate = new Decimal(Math.random() * (0.05 - 0.02) + 0.02); // Random rate between 2% and 5%
    chargeAmount = transactionAmount.times(chargeRate);
    transactionAmount = transactionAmount.plus(chargeAmount); // Add charge to the transaction amount
    logger.info(`Applied charge of ${chargeAmount.toFixed(2)} for ${type} transaction. New total amount: ${transactionAmount.toFixed(2)}`);
  }

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
      newBalance = newBalance.plus(transactionAmount.minus(chargeAmount)); // Top-ups don't have charges subtracted from the actual amount received
    }

    transactionStatus = TransactionStatus.COMPLETED;

    await creditCard.update({ currentBalance: newBalance.toFixed(2) }); // Convert back to number or string for DB

    const transaction = await Transaction.create({
      cardId,
      amount: amount, // Store original amount, charges are implied
      type,
      status: transactionStatus,
      description: description + (chargeAmount.greaterThan(0) ? ` (includes charge of ${chargeAmount.toFixed(2)})` : ''),
      merchant: merchant || (type === TransactionType.DEBIT ? 'Simulated Merchant' : null),
      recipientDetails: recipientDetails || null,
    });

    logger.info(`Simulated ${type} transaction completed successfully for card ${cardId}. New balance: ${newBalance.toFixed(2)}`);
    return { success: true, message: 'Payment processed successfully.', transaction };
  } catch (error: any) {
    logger.error(`Simulated ${type} transaction failed for card ${cardId}: ${error.message}`);

    // Record failed transaction
    const transaction = await Transaction.create({
      cardId,
      amount: amount, // Store original amount, charges are implied
      type,
      status: TransactionStatus.FAILED,
      description: description + (chargeAmount.greaterThan(0) ? ` (includes charge of ${chargeAmount.toFixed(2)})` : ''),
      merchant: merchant || (type === TransactionType.DEBIT ? 'Simulated Merchant' : null),
      recipientDetails: recipientDetails || null,
    });

    return { success: false, message: error.message, transaction };
  }
};

// Specific functions for different payment types
export const topUpMobileMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting Mobile Money top-up for card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TOP_UP, amount, cardId, description, 'Mobile Money', recipientDetails);
};

export const topUpOrangeMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting Orange Money top-up for card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TOP_UP, amount, cardId, description, 'Orange Money', recipientDetails);
};

export const topUpBankAccount = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting Bank Account top-up for card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TOP_UP, amount, cardId, description, 'Bank Account', recipientDetails);
};

export const sendToMobileMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Mobile Money from card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TRANSFER, amount, cardId, description, 'Mobile Money Transfer', recipientDetails);
};

export const sendToOrangeMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Orange Money from card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TRANSFER, amount, cardId, description, 'Orange Money Transfer', recipientDetails);
};

export const sendToBankAccount = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Bank Account from card ${cardId}, amount: ${amount}`);
  return simulatePaymentGateway(TransactionType.TRANSFER, amount, cardId, description, 'Bank Account Transfer', recipientDetails);
};

export const processCardPayment = async (
  amount: number,
  cardId: number,
  description: string,
  merchant: string,
  recipientDetails?: string,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
  logger.info(`Attempting card payment for card ${cardId}, amount: ${amount} to ${merchant}`);
  return simulatePaymentGateway(TransactionType.DEBIT, amount, cardId, description, merchant, recipientDetails);
};
