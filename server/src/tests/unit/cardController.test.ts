import { Request, Response } from 'express';
import CreditCard from '../../models/CreditCard';
import User from '../../models/User';
import logger from '../../config/logger';
import { sendEmail } from '../../controllers/authController';
import { createCreditCard, getAllCreditCards, getCreditCardById, blockCreditCard, encryptCardNumber, decryptCardNumber } from '../../controllers/cardController';
import { CardStatus, CardType } from '../../constants/enums';
import { Decimal } from 'decimal.js';
import * as CreditCardModel from '../../models/CreditCard'; // Import the entire module to mock schema

// Mocking dependencies
jest.mock('../../models/CreditCard');
jest.mock('../../models/User');
jest.mock('../../config/logger');
jest.mock('../../controllers/authController', () => ({
  sendEmail: jest.fn(),
}));

// Correctly mock Decimal.js
jest.mock('decimal.js', () => {
  class MockDecimal {
    private value: number;
    constructor(value: number) {
      this.value = value;
    }
    toFixed(places: number) {
      return parseFloat(this.value.toFixed(places)); // Ensure it returns a number for comparison
    }
    toString() {
      return String(this.value);
    }
  }
  return { Decimal: MockDecimal };
});

// Define a mock AuthenticatedRequest interface
interface MockAuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

describe('Card Controller Unit Tests', () => {
  let mockRequest: Partial<MockAuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let statusSpy: jest.SpyInstance;
  let jsonSpy: jest.SpyInstance;
  let encryptCardNumberSpy: jest.SpyInstance;
  let decryptCardNumberSpy: jest.SpyInstance;
  let creditCardSchemaValidateSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    statusSpy = jest.spyOn(mockResponse, 'status');
    jsonSpy = jest.spyOn(mockResponse, 'json');

    jest.clearAllMocks();

    // Spy on and mock encryption/decryption functions
    encryptCardNumberSpy = jest.spyOn(require('../../controllers/cardController'), 'encryptCardNumber').mockImplementation((cardNumber) => `encrypted_${cardNumber}`);
    decryptCardNumberSpy = jest.spyOn(require('../../controllers/cardController'), 'decryptCardNumber').mockImplementation((encryptedCardNumber) => {
      if (typeof encryptedCardNumber !== 'string') {
        throw new Error("Invalid input for decryptCardNumber: not a string");
      }
      return encryptedCardNumber.replace('encrypted_', '');
    });

    // Spy on and mock creditCardSchema.validate
    creditCardSchemaValidateSpy = jest.spyOn(CreditCardModel.creditCardSchema, 'validate').mockImplementation((data) => {
      // This is a simplified validation for testing. Real validation is handled by yup.
      if (!data.cardNumber || data.cardNumber.length !== 16) {
        const error = new Error('Card number must be 16 digits') as any;
        error.name = 'ValidationError';
        error.errors = ['Card number must be 16 digits'];
        throw error;
      }
      if (!data.expiryMonth || !/^(0[1-9]|1[0-2])$/.test(data.expiryMonth)) {
        const error = new Error('Invalid expiry month (MM)') as any;
        error.name = 'ValidationError';
        error.errors = ['Invalid expiry month (MM)'];
        throw error;
      }
      if (!data.expiryYear || !/^(20)\d{2}$/.test(data.expiryYear)) {
        const error = new Error('Invalid expiry year (YYYY)') as any;
        error.name = 'ValidationError';
        error.errors = ['Invalid expiry year (YYYY)'];
        throw error;
      }
      if (data.creditLimit === undefined || data.creditLimit < 0) {
        const error = new Error('Credit limit cannot be negative') as any;
        error.name = 'ValidationError';
        error.errors = ['Credit limit cannot be negative'];
        throw error;
      }
      return data; // Return data if valid
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCreditCard', () => {
    it('should create a credit card successfully for an authenticated user', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        body: {
          cardNumber: '1234567890123456',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
        },
      };

      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        toJSON: () => ({ id: 1, firstName: 'John', lastName: 'Doe', email: 'test@example.com' }),
      });
      (CreditCard.findOne as jest.Mock).mockResolvedValue(null);
      (CreditCard.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        cardNumber: 'encrypted_1234567890123456',
        cardHolderName: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 5000.00,
        currentBalance: 0.00,
        status: CardStatus.PENDING,
        cardType: CardType.VISA,
        toJSON: () => ({
          id: 1,
          userId: 1,
          cardNumber: 'encrypted_1234567890123456',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
          currentBalance: 0.00,
          status: CardStatus.PENDING,
          cardType: CardType.VISA,
        }),
      });

      await createCreditCard(mockRequest as any, mockResponse as Response);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(encryptCardNumberSpy).toHaveBeenCalledWith('1234567890123456');
      expect(CreditCard.findOne).toHaveBeenCalledWith({ where: { cardNumber: 'encrypted_1234567890123456' } });
      expect(CreditCard.create).toHaveBeenCalledWith({
        userId: 1,
        cardNumber: 'encrypted_1234567890123456',
        cardHolderName: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 5000.00,
        currentBalance: 0.0,
        status: CardStatus.PENDING,
        cardType: CardType.VISA,
      });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'New Credit Card Created',
        'new_card_created',
        expect.objectContaining({
          USER_NAME: 'John',
          CARD_TYPE: 'visa',
          LAST_FOUR_DIGITS: '3456',
          CREDIT_LIMIT: 5000.00,
        })
      );
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest = { body: {} }; // No user in request

      await createCreditCard(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'User not authenticated.' });
      expect(CreditCard.create).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        body: {
          cardNumber: '123', // Invalid card number
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
        },
      };

      await createCreditCard(mockRequest as any, mockResponse as Response);

      expect(creditCardSchemaValidateSpy).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ errors: ['Card number must be 16 digits'] }));
      expect(CreditCard.create).not.toHaveBeenCalled();
    });

    it('should return 409 if credit card with number already exists', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        body: {
          cardNumber: '1234567890123456',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
        },
      };
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
      });
      (CreditCard.findOne as jest.Mock).mockResolvedValue(true); // Card already exists

      await createCreditCard(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Credit card with this number already exists.' });
      expect(CreditCard.create).not.toHaveBeenCalled();
    });

    it('should return 500 if an internal error occurs', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        body: {
          cardNumber: '1234567890123456',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
        },
      };
      (User.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createCreditCard(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getAllCreditCards', () => {
    it('should return all credit cards for an authenticated user', async () => {
      mockRequest = { user: { id: 1, email: 'test@example.com' } };
      const mockCards = [
        {
          id: 1,
          userId: 1,
          cardNumber: 'encrypted_1111222233334444',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
          currentBalance: 1000.00,
          status: CardStatus.ACTIVE,
          cardType: CardType.VISA,
          toJSON: () => ({
            id: 1,
            userId: 1,
            cardNumber: 'encrypted_1111222233334444',
            cardHolderName: 'John Doe',
            expiryMonth: '12',
            expiryYear: '2025',
            creditLimit: 5000.00,
            currentBalance: 1000.00,
            status: CardStatus.ACTIVE,
            cardType: CardType.VISA,
          }),
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@example.com',
            toJSON: () => ({ id: 1, firstName: 'John', lastName: 'Doe', email: 'test@example.com' }),
          },
        },
      ];
      (CreditCard.findAll as jest.Mock).mockResolvedValue(mockCards);

      await getAllCreditCards(mockRequest as any, mockResponse as Response);

      expect(CreditCard.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: [{ model: User, as: 'user' }],
      });
      expect(decryptCardNumberSpy).toHaveBeenCalledWith('encrypted_1111222233334444');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          cardNumber: '**** **** **** 4444', // Decrypted and masked
          user: expect.objectContaining({ id: 1 }),
        }),
      ]));
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest = { body: {} }; // No user in request

      await getAllCreditCards(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'User not authenticated.' });
      expect(CreditCard.findAll).not.toHaveBeenCalled();
    });

    it('should return 500 if an internal error occurs', async () => {
      mockRequest = { user: { id: 1, email: 'test@example.com' } };
      (CreditCard.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAllCreditCards(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCreditCardById', () => {
    it('should return a credit card by ID for an authenticated user', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        params: { id: '1' },
      };
      const mockCard = {
        id: 1,
        userId: 1,
        cardNumber: 'encrypted_1111222233334444',
        cardHolderName: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 5000.00,
        currentBalance: 1000.00,
        status: CardStatus.ACTIVE,
        cardType: CardType.VISA,
        toJSON: () => ({
          id: 1,
          userId: 1,
          cardNumber: 'encrypted_1111222233334444',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
          currentBalance: 1000.00,
          status: CardStatus.ACTIVE,
          cardType: CardType.VISA,
        }),
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          toJSON: () => ({ id: 1, firstName: 'John', lastName: 'Doe', email: 'test@example.com' }),
        },
      };
      (CreditCard.findOne as jest.Mock).mockResolvedValue(mockCard);

      await getCreditCardById(mockRequest as any, mockResponse as Response);

      expect(CreditCard.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 1 },
        include: [{ model: User, as: 'user' }],
      });
      expect(decryptCardNumberSpy).toHaveBeenCalledWith('encrypted_1111222233334444');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        cardNumber: '**** **** **** 4444', // Decrypted and masked
        user: expect.objectContaining({ id: 1 }),
      }));
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest = { params: { id: '1' } }; // No user in request

      await getCreditCardById(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'User not authenticated.' });
      expect(CreditCard.findOne).not.toHaveBeenCalled();
    });

    it('should return 404 if credit card not found', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        params: { id: '999' },
      };
      (CreditCard.findOne as jest.Mock).mockResolvedValue(null);

      await getCreditCardById(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Credit card not found.' });
    });

    it('should return 500 if an internal error occurs', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        params: { id: '1' },
      };
      (CreditCard.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getCreditCardById(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('blockCreditCard', () => {
    it('should block a credit card successfully for an authenticated user', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        params: { id: '1' },
      };
      const mockCard = {
        id: 1,
        userId: 1,
        cardNumber: 'encrypted_1111222233334444',
        cardHolderName: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 5000.00,
        currentBalance: 1000.00,
        status: CardStatus.ACTIVE,
        cardType: CardType.VISA,
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({
          id: 1,
          userId: 1,
          cardNumber: 'encrypted_1111222233334444',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          creditLimit: 5000.00,
          currentBalance: 1000.00,
          status: CardStatus.BLOCKED, // Updated status
          cardType: CardType.VISA,
        }),
      };
      (CreditCard.findOne as jest.Mock).mockResolvedValue(mockCard);
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        firstName: 'John',
        email: 'test@example.com',
      });

      await blockCreditCard(mockRequest as any, mockResponse as Response);

      expect(CreditCard.findOne).toHaveBeenCalledWith({ where: { id: '1', userId: 1 } });
      expect(mockCard.update).toHaveBeenCalledWith({ status: CardStatus.BLOCKED });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(decryptCardNumberSpy).toHaveBeenCalledWith('encrypted_1111222233334444');
      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Credit Card Blocked',
        'card_blocked',
        expect.objectContaining({
          USER_NAME: 'John',
          CARD_TYPE: 'visa',
          LAST_FOUR_DIGITS: '4444',
        })
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Credit card blocked successfully.', creditCard: expect.any(Object) }));
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest = { params: { id: '1' } }; // No user in request

      await blockCreditCard(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'User not authenticated.' });
      expect(CreditCard.findOne).not.toHaveBeenCalled();
    });

    it('should return 404 if credit card not found', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        params: { id: '999' },
      };
      (CreditCard.findOne as jest.Mock).mockResolvedValue(null);

      await blockCreditCard(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Credit card not found.' });
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should return 500 if an internal error occurs', async () => {
      mockRequest = {
        user: { id: 1, email: 'test@example.com' },
        params: { id: '1' },
      };
      (CreditCard.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await blockCreditCard(mockRequest as any, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
