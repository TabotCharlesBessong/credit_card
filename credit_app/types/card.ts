import { CardStatus, CardType } from '../constants/enums';

export interface CreditCard {
  id: number;
  userId: number;
  cardNumber: string; // Masked on frontend
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  creditLimit: number;
  currentBalance: number;
  status: CardStatus;
  cardType: CardType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditCardData {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  creditLimit: number;
}
