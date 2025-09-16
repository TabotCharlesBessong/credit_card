import axios from 'axios';
import { CreditCard, CreateCreditCardData } from '../types/card';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: any;
}

const cardService = {
  createCreditCard: async (cardData: CreateCreditCardData, token: string): Promise<ApiResponse<CreditCard>> => {
    try {
      const response = await axios.post(`${API_URL}/cards`, cardData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.errors || error.message };
    }
  },

  getAllCreditCards: async (token: string): Promise<ApiResponse<CreditCard[]>> => {
    try {
      const response = await axios.get(`${API_URL}/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.message || error.message };
    }
  },

  getCreditCardById: async (id: number, token: string): Promise<ApiResponse<CreditCard>> => {
    try {
      const response = await axios.get(`${API_URL}/cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.message || error.message };
    }
  },

  blockCreditCard: async (id: number, token: string): Promise<ApiResponse<{ message: string; creditCard: CreditCard }>> => {
    try {
      const response = await axios.put(`${API_URL}/cards/${id}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: response.data };
    } catch (error: any) {
      return { errors: error.response?.data?.message || error.message };
    }
  },
};

export default cardService;
