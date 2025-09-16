import axios from 'axios';
import { Transaction, TopUpData, SendMoneyData, CardPaymentData, TransactionResult } from '../types/transaction';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: any;
}

const transactionService = {
  // Top-up functions
  topUpMobileMoney: async (topUpData: TopUpData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/topup/mobile-money`, topUpData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  topUpOrangeMoney: async (topUpData: TopUpData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/topup/orange-money`, topUpData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  topUpBankAccount: async (topUpData: TopUpData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/topup/bank-account`, topUpData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  // Send money functions
  sendToMobileMoney: async (sendMoneyData: SendMoneyData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/send/mobile-money`, sendMoneyData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  sendToOrangeMoney: async (sendMoneyData: SendMoneyData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/send/orange-money`, sendMoneyData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  sendToBankAccount: async (sendMoneyData: SendMoneyData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/send/bank-account`, sendMoneyData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  // Card payment function
  processCardPayment: async (cardPaymentData: CardPaymentData, token: string): Promise<ApiResponse<TransactionResult>> => {
    try {
      const response = await axios.post(`${API_URL}/payments/card/charge`, cardPaymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  // Fetch transactions for a card
  fetchCardTransactions: async (cardId: number, token: string): Promise<ApiResponse<Transaction[]>> => {
    try {
      const response = await axios.get(`${API_URL}/payments/credit-cards/${cardId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.message || error.message };
    }
  },
};

export default transactionService;
