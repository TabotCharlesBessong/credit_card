import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // Replace with your backend API base URL

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  // Add any other user properties you expect from the backend
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface ActivateAccountRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authApi.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const response = await authApi.post<RegisterResponse>('/auth/register', userData);
  return response.data;
};

export const activateAccount = async (data: ActivateAccountRequest): Promise<void> => {
  await authApi.post('/auth/activate', data);
};

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await authApi.post('/auth/forgot-password', data);
};

export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await authApi.post('/auth/reset-password', data);
};

export default authApi;
