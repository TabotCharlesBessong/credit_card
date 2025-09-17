import { TransactionType, TransactionStatus } from '../constants/enums';

export interface Transaction {
  id: number;
  cardId: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  merchant: string | null;
  transactionDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface TopUpData {
  cardId: number;
  amount: number;
  description: string;
  recipientDetails: string;
  phoneNumber?: string; // Optional for mobile money top-ups
}

export interface SendMoneyData {
  cardId: number;
  amount: number;
  description: string;
  recipientDetails: string;
  phoneNumber?: string; // Optional for mobile money transfers
}

export interface CardPaymentData {
  cardId: number;
  amount: number;
  description: string;
  merchant: string;
}

export interface TransactionResult {
  message: string;
  transaction?: Transaction; // Transaction is optional as it might be pending initiation
  redirectUrl?: string; // Added for Fapshi integration
}
