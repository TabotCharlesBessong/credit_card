import logger from '../config/logger';
import { TransactionType, TransactionStatus, FapshiPaymentMethod, PaymentGateway } from '../constants/enums';
import CreditCard from '../models/CreditCard';
import Transaction from '../models/Transaction';
import { Decimal } from 'decimal.js';
import axios from 'axios';
// import config from '../config/config.json';
import dotenv from 'dotenv';
dotenv.config();

const currentEnv = process.env.NODE_ENV || 'development';
// const fapshiConfig = (config as any)[currentEnv];

interface FapshiTransactionResponse {
  redirect_url: string;
  transaction_id: string;
  status: string;
}

const fapshiConfig = {
  fapshi_base_url: process.env.FAPSHI_BASE_URL,
  fapshi_secret_key: process.env.FAPSHI_SECRET_KEY,
  fapshi_public_key: process.env.FAPSHI_PUBLIC_KEY,
};

const makeFapshiRequest = async (endpoint: string, data: any): Promise<FapshiTransactionResponse> => {
  try {
    const response = await axios.post(`${fapshiConfig.fapshi_base_url}${endpoint}`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${fapshiConfig.fapshi_secret_key}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    logger.error("Fapshi API request failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Fapshi API request failed');
  }
};

// Placeholder for Fapshi-specific transaction creation
export const createFapshiTransaction = async (
  amount: number,
  currency: string,
  description: string,
  clientRef: string,
  redirectUrl: string,
  webhookUrl: string,
  paymentMethod: FapshiPaymentMethod,
  phoneNumber?: string // For mobile money
): Promise<{ success: boolean; message: string; redirectUrl?: string; transactionId?: string }> => {
  try {
    const fapshiResponse = await makeFapshiRequest('/transactions', {
      amount,
      currency,
      description,
      client_ref: clientRef,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      payment_method: paymentMethod,
      // Include phone number if required and provided for mobile money methods
      ...(phoneNumber && (paymentMethod === FapshiPaymentMethod.MTN_MOMO || paymentMethod === FapshiPaymentMethod.ORANGE_MONEY) && { phone_number: phoneNumber }),
    });

    if (fapshiResponse.redirect_url) {
      return { success: true, message: 'Fapshi transaction initiated.', redirectUrl: fapshiResponse.redirect_url, transactionId: fapshiResponse.transaction_id };
    } else {
      logger.error("Fapshi transaction initiation failed:", fapshiResponse);
      return { success: false, message: 'Failed to initiate Fapshi transaction.' };
    }
  } catch (error: any) {
    logger.error("Error in createFapshiTransaction:", error.message);
    return { success: false, message: error.message };
  }
};

// Refactor existing payment functions to use Fapshi
export const topUpMobileMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
  phoneNumber: string, // Fapshi requires phone number for mobile money
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting Mobile Money top-up via Fapshi for card ${cardId}, amount: ${amount}`);
  try {
    // Assume XAF currency for Fapshi
    const currency = 'XAF'; 
    // For a real application, cardId and other details would be stored and retrieved
    // Here we're directly initiating a Fapshi transaction.
    const clientRef = `topup_momo_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook'; // Replace with actual webhook

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.MTN_MOMO,
      phoneNumber
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      // Create a pending transaction in your DB. This will be updated by webhook.
      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.PENDING,
        description: `Fapshi Mobile Money Top-up: ${description}`,
        merchant: 'MTN Mobile Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI, // Store which gateway was used
        gatewayTransactionId: fapshiResult.transactionId, // Store Fapshi's transaction ID
      });
      return { ...fapshiResult, transaction };
    } else {
      // Record failed transaction if Fapshi initiation fails
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.FAILED,
        description: `Fapshi Mobile Money Top-up failed: ${description}`,
        merchant: 'MTN Mobile Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in topUpMobileMoney (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const topUpOrangeMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
  phoneNumber: string, // Fapshi requires phone number for mobile money
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting Orange Money top-up via Fapshi for card ${cardId}, amount: ${amount}`);
  try {
    const currency = 'XAF';
    const clientRef = `topup_orange_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook';

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.ORANGE_MONEY,
      phoneNumber
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.PENDING,
        description: `Fapshi Orange Money Top-up: ${description}`,
        merchant: 'Orange Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
        gatewayTransactionId: fapshiResult.transactionId,
      });
      return { ...fapshiResult, transaction };
    } else {
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.FAILED,
        description: `Fapshi Orange Money Top-up failed: ${description}`,
        merchant: 'Orange Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in topUpOrangeMoney (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const topUpBankAccount = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting Bank Account top-up via Fapshi for card ${cardId}, amount: ${amount}`);
  try {
    const currency = 'XAF';
    const clientRef = `topup_bank_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook';

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.BANK_TRANSFER
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.PENDING,
        description: `Fapshi Bank Account Top-up: ${description}`,
        merchant: 'Bank Transfer',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
        gatewayTransactionId: fapshiResult.transactionId,
      });
      return { ...fapshiResult, transaction };
    } else {
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.FAILED,
        description: `Fapshi Bank Account Top-up failed: ${description}`,
        merchant: 'Bank Transfer',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in topUpBankAccount (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const sendToMobileMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
  phoneNumber: string,
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Mobile Money via Fapshi from card ${cardId}, amount: ${amount}`);
  try {
    // Before initiating Fapshi transaction, check if card has sufficient funds
    const creditCard = await CreditCard.findByPk(cardId);
    if (!creditCard) {
      return { success: false, message: 'Credit card not found.' };
    }
    if (new Decimal(creditCard.currentBalance).lessThan(amount)) {
      return { success: false, message: 'Insufficient funds on card.' };
    }

    const currency = 'XAF';
    const clientRef = `send_momo_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook';

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.MTN_MOMO,
      phoneNumber
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      // Temporarily deduct from balance. Final update will be via webhook.
      await creditCard.update({ currentBalance: new Decimal(creditCard.currentBalance).minus(amount).toFixed(2) });

      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        description: `Fapshi Mobile Money Send: ${description}`,
        merchant: 'MTN Mobile Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
        gatewayTransactionId: fapshiResult.transactionId,
      });
      return { ...fapshiResult, transaction };
    } else {
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.FAILED,
        description: `Fapshi Mobile Money Send failed: ${description}`,
        merchant: 'MTN Mobile Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in sendToMobileMoney (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const sendToOrangeMoney = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
  phoneNumber: string,
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Orange Money via Fapshi from card ${cardId}, amount: ${amount}`);
  try {
    const creditCard = await CreditCard.findByPk(cardId);
    if (!creditCard) {
      return { success: false, message: 'Credit card not found.' };
    }
    if (new Decimal(creditCard.currentBalance).lessThan(amount)) {
      return { success: false, message: 'Insufficient funds on card.' };
    }

    const currency = 'XAF';
    const clientRef = `send_orange_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook';

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.ORANGE_MONEY,
      phoneNumber
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      await creditCard.update({ currentBalance: new Decimal(creditCard.currentBalance).minus(amount).toFixed(2) });

      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        description: `Fapshi Orange Money Send: ${description}`,
        merchant: 'Orange Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
        gatewayTransactionId: fapshiResult.transactionId,
      });
      return { ...fapshiResult, transaction };
    } else {
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.FAILED,
        description: `Fapshi Orange Money Send failed: ${description}`,
        merchant: 'Orange Money',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in sendToOrangeMoney (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const sendToBankAccount = async (
  amount: number,
  cardId: number,
  description: string,
  recipientDetails: string,
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting to send money to Bank Account via Fapshi from card ${cardId}, amount: ${amount}`);
  try {
    const creditCard = await CreditCard.findByPk(cardId);
    if (!creditCard) {
      return { success: false, message: 'Credit card not found.' };
    }
    if (new Decimal(creditCard.currentBalance).lessThan(amount)) {
      return { success: false, message: 'Insufficient funds on card.' };
    }

    const currency = 'XAF';
    const clientRef = `send_bank_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook';

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.BANK_TRANSFER
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      await creditCard.update({ currentBalance: new Decimal(creditCard.currentBalance).minus(amount).toFixed(2) });

      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        description: `Fapshi Bank Account Send: ${description}`,
        merchant: 'Bank Transfer',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
        gatewayTransactionId: fapshiResult.transactionId,
      });
      return { ...fapshiResult, transaction };
    } else {
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.FAILED,
        description: `Fapshi Bank Account Send failed: ${description}`,
        merchant: 'Bank Transfer',
        recipientDetails,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in sendToBankAccount (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const processCardPayment = async (
  amount: number,
  cardId: number,
  description: string,
  merchant: string,
): Promise<{ success: boolean; message: string; redirectUrl?: string; transaction?: Transaction }> => {
  logger.info(`Attempting card payment via Fapshi for card ${cardId}, amount: ${amount} to ${merchant}`);
  try {
    const creditCard = await CreditCard.findByPk(cardId);
    if (!creditCard) {
      return { success: false, message: 'Credit card not found.' };
    }
    if (new Decimal(creditCard.currentBalance).lessThan(amount)) {
      return { success: false, message: 'Insufficient funds on card.' };
    }

    const currency = 'XAF';
    const clientRef = `card_payment_${cardId}_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/payment-status?cardId=${cardId}`;
    const webhookUrl = 'http://your-server.com/fapshi-webhook';

    const fapshiResult = await createFapshiTransaction(
      amount,
      currency,
      description,
      clientRef,
      redirectUrl,
      webhookUrl,
      FapshiPaymentMethod.CREDIT_CARD
    );

    if (fapshiResult.success && fapshiResult.redirectUrl) {
      await creditCard.update({ currentBalance: new Decimal(creditCard.currentBalance).minus(amount).toFixed(2) });

      const transaction = await Transaction.create({
        cardId,
        amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.PENDING,
        description: `Fapshi Card Payment: ${description}`,
        merchant,
        paymentGateway: PaymentGateway.FAPSHI,
        gatewayTransactionId: fapshiResult.transactionId,
      });
      return { ...fapshiResult, transaction };
    } else {
      await Transaction.create({
        cardId,
        amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.FAILED,
        description: `Fapshi Card Payment failed: ${description}`,
        merchant,
        paymentGateway: PaymentGateway.FAPSHI,
      });
      return { success: false, message: fapshiResult.message };
    }
  } catch (error: any) {
    logger.error(`Error in processCardPayment (Fapshi):`, error.message);
    return { success: false, message: error.message };
  }
};

export const getTransactionsByCardId = async (cardId: number): Promise<Transaction[]> => {
  try {
    const transactions = await Transaction.findAll({
      where: { cardId },
      order: [['transactionDate', 'DESC']],
    });
    return transactions;
  } catch (error: any) {
    logger.error(`Error fetching transactions for card ID ${cardId}:`, error);
    throw new Error('Failed to fetch transactions.');
  }
};