process.env.JWT_SECRET = 'test-jwt-secret';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';

import request from 'supertest';
import { app, startServer, stopServer } from '../../index';
import { initializeDatabase, User, CreditCard, Transaction } from '../../models';
import { Sequelize } from 'sequelize';
import logger from '../../config/logger';
import * as authController from '../../controllers/authController';
import { CardStatus, CardType, TransactionType, TransactionStatus, PaymentGateway } from '../../constants/enums';
import bcrypt from 'bcrypt';
import * as paymentService from '../../services/paymentService';

jest.mock('../../config/logger');
jest.mock('../../controllers/authController', () => ({
  ...jest.requireActual('../../controllers/authController'),
  sendEmail: jest.fn(),
}));

// Mock Fapshi-related functions in paymentService
jest.mock('../../services/paymentService', () => ({
  ...jest.requireActual('../../services/paymentService'),
  createFapshiTransaction: jest.fn(),
}));

let sequelizeInstance: Sequelize;
let authToken: string;
let testUser: User;
let testCard: CreditCard;

describe('Transaction Integration Tests', () => {
  beforeAll(async () => {
    sequelizeInstance = await initializeDatabase();
    await startServer();

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'transactiontest@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'Password123!' });
    authToken = loginResponse.body.token;

    // Create a credit card for the test user
    const createCardResponse = await request(app)
      .post('/api/credit-cards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cardNumber: '1111222233334444',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 5000.00,
      });
    testCard = createCardResponse.body;
  });

  beforeEach(async () => {
    await sequelizeInstance.sync({ force: true });
    jest.clearAllMocks();

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'transactiontest@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'Password123!' });
    authToken = loginResponse.body.token;

    // Recreate test card
    const createCardResponse = await request(app)
      .post('/api/credit-cards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cardNumber: '1111222233334444',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 5000.00,
      });
    testCard = createCardResponse.body;
    (authController.sendEmail as jest.Mock).mockClear();
    (paymentService.createFapshiTransaction as jest.Mock).mockClear();
  });

  afterAll(async () => {
    await sequelizeInstance.close();
    await stopServer();
    jest.restoreAllMocks();
  });

  describe('POST /api/payments/topup/mobile-money', () => {
    it('should successfully top up mobile money and create a transaction (Fapshi)', async () => {
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/123',
        transactionId: 'fapshi_tx_123',
      });

      const response = await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 100.00,
          description: 'Mobile money top-up',
          recipientDetails: 'MTN Mobile Money',
          phoneNumber: '237678901234',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/123');
      expect(response.body.transaction).toHaveProperty('id');
      expect(response.body.transaction.cardId).toBe(testCard.id);
      expect(response.body.transaction.amount).toBe(100);
      expect(response.body.transaction.type).toBe(TransactionType.TOP_UP);
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING); // Initial status should be PENDING
      expect(response.body.transaction.paymentGateway).toBe(PaymentGateway.FAPSHI);
      expect(response.body.transaction.gatewayTransactionId).toBe('fapshi_tx_123');
      expect(authController.sendEmail).toHaveBeenCalledTimes(1); // Email for pending status
    });

    it('should handle Fapshi transaction initiation failure for mobile money top-up', async () => {
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Failed to connect to Fapshi.',
      });

      const response = await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 100.00,
          description: 'Mobile money top-up',
          recipientDetails: 'MTN Mobile Money',
          phoneNumber: '237678901234',
        });

      expect(response.status).toBe(400); // Bad request due to Fapshi initiation failure
      expect(response.body.message).toBe('Failed to connect to Fapshi.');
      expect(response.body.transaction.status).toBe(TransactionStatus.FAILED);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1); // Email for failed status
    });
  });

  describe('POST /api/payments/topup/orange-money', () => {
    it('should successfully top up Orange Money and create a transaction (Fapshi)', async () => {
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/456',
        transactionId: 'fapshi_tx_456',
      });

      const response = await request(app)
        .post('/api/payments/topup/orange-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 200.00,
          description: 'Orange Money top-up',
          recipientDetails: 'Orange Money',
          phoneNumber: '237699887766',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/456');
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/payments/topup/bank-account', () => {
    it('should successfully top up Bank Account and create a transaction (Fapshi)', async () => {
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/789',
        transactionId: 'fapshi_tx_789',
      });

      const response = await request(app)
        .post('/api/payments/topup/bank-account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 500.00,
          description: 'Bank Account top-up',
          recipientDetails: 'Bank Name - 123456789',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/789');
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/payments/send/mobile-money', () => {
    it('should successfully send money to mobile money and create a transaction (Fapshi)', async () => {
      // First, ensure the card has enough balance for a debit transaction
      await testCard.update({ currentBalance: 500.00 });
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/101',
        transactionId: 'fapshi_tx_101',
      });
      (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after setup

      const response = await request(app)
        .post('/api/payments/send/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 50.00,
          description: 'Send money to friend',
          recipientDetails: 'MTN Mobile Money',
          phoneNumber: '237699887766',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/101');
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);

      // Verify card balance is temporarily deducted
      const updatedCard = await CreditCard.findByPk(testCard.id);
      expect(updatedCard?.currentBalance).toBeCloseTo(450.00); // 500 - 50
    });

    it('should return 400 for insufficient funds when sending money', async () => {
      await testCard.update({ currentBalance: 20.00 }); // Low balance
      (paymentService.createFapshiTransaction as jest.Mock).mockClear(); // Ensure it's not called
      (authController.sendEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/payments/send/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 50.00,
          description: 'Send money to friend',
          recipientDetails: 'MTN Mobile Money',
          phoneNumber: '237699887766',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Insufficient funds on card.');
      expect(paymentService.createFapshiTransaction).not.toHaveBeenCalled();
      expect(authController.sendEmail).not.toHaveBeenCalled();

      // Verify no transaction was created
      const transactions = await Transaction.findAll({ where: { cardId: testCard.id } });
      expect(transactions).toHaveLength(0);
    });
  });

  describe('POST /api/payments/send/orange-money', () => {
    it('should successfully send money to Orange Money and create a transaction (Fapshi)', async () => {
      await testCard.update({ currentBalance: 600.00 });
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/202',
        transactionId: 'fapshi_tx_202',
      });
      (authController.sendEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/payments/send/orange-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 70.00,
          description: 'Send money to family',
          recipientDetails: 'Orange Money',
          phoneNumber: '237655443322',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/202');
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);

      const updatedCard = await CreditCard.findByPk(testCard.id);
      expect(updatedCard?.currentBalance).toBeCloseTo(530.00); // 600 - 70
    });
  });

  describe('POST /api/payments/send/bank-account', () => {
    it('should successfully send money to Bank Account and create a transaction (Fapshi)', async () => {
      await testCard.update({ currentBalance: 800.00 });
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/303',
        transactionId: 'fapshi_tx_303',
      });
      (authController.sendEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/payments/send/bank-account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 120.00,
          description: 'Bank transfer',
          recipientDetails: 'Bank ABC - 987654321',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/303');
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);

      const updatedCard = await CreditCard.findByPk(testCard.id);
      expect(updatedCard?.currentBalance).toBeCloseTo(680.00); // 800 - 120
    });
  });

  describe('POST /api/payments/card/charge', () => {
    it('should successfully process a card payment and create a transaction (Fapshi)', async () => {
      await testCard.update({ currentBalance: 1000.00 });
      (paymentService.createFapshiTransaction as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Fapshi transaction initiated.',
        redirectUrl: 'https://fapshi.com/redirect/404',
        transactionId: 'fapshi_tx_404',
      });
      (authController.sendEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/payments/card/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 150.00,
          description: 'Online purchase',
          merchant: 'Fapshi Store',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fapshi transaction initiated.');
      expect(response.body).toHaveProperty('redirectUrl', 'https://fapshi.com/redirect/404');
      expect(response.body.transaction.status).toBe(TransactionStatus.PENDING);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);

      const updatedCard = await CreditCard.findByPk(testCard.id);
      expect(updatedCard?.currentBalance).toBeCloseTo(850.00); // 1000 - 150
    });
  });

  describe('GET /api/credit-cards/:cardId/transactions', () => {
    let anotherUser: User;
    let anotherUserAuthToken: string;
    let anotherUserCard: CreditCard;

    beforeEach(async () => {
      // Ensure testCard has balance for transactions below
      await testCard.update({ currentBalance: 1000.00 });

      // Create another user and their card
      const anotherUserHashedPassword = await bcrypt.hash('AnotherPass123!', 10);
      anotherUser = await User.create({
        firstName: 'Another',
        lastName: 'User',
        email: 'anothertransactionuser@example.com',
        password: anotherUserHashedPassword,
        isVerified: true,
      });

      const anotherUserLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: anotherUser.email, password: 'AnotherPass123!' });
      anotherUserAuthToken = anotherUserLoginResponse.body.token;

      const createAnotherCardResponse = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${anotherUserAuthToken}`)
        .send({
          cardNumber: '5555666677778888',
          expiryMonth: '10',
          expiryYear: '2026',
          creditLimit: 7500.00,
        });
      anotherUserCard = createAnotherCardResponse.body;

      // Create some transactions for the testUser's card using Fapshi mock
      (paymentService.createFapshiTransaction as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          message: 'Fapshi transaction initiated.',
          redirectUrl: 'https://fapshi.com/redirect/tx1',
          transactionId: 'fapshi_tx_get1',
        })
        .mockResolvedValueOnce({
          success: true,
          message: 'Fapshi transaction initiated.',
          redirectUrl: 'https://fapshi.com/redirect/tx2',
          transactionId: 'fapshi_tx_get2',
        });

      await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 1000.00,
          description: 'Initial top-up',
          recipientDetails: 'MTN Mobile Money',
          phoneNumber: '237678901234',
        });

      await request(app)
        .post('/api/payments/card/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 150.00,
          description: 'Restaurant bill',
          merchant: 'Fancy Eats',
        });

      // Manually update status to COMPLETED for these transactions in the DB for GET test assertions
      const pendingTransactions = await Transaction.findAll({ where: { cardId: testCard.id, status: TransactionStatus.PENDING } });
      for (const tx of pendingTransactions) {
        await tx.update({ status: TransactionStatus.COMPLETED });
      }
      testCard = (await CreditCard.findByPk(testCard.id)) as CreditCard; // Refetch card to update balance after pending ops
      (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after setup
    });

    it('should return all transactions for the authenticated user\'s card, including Fapshi ones', async () => {
      const response = await request(app)
        .get(`/api/payments/credit-cards/${testCard.id}/transactions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].cardId).toBe(testCard.id);
      expect(response.body[0].type).toBe(TransactionType.DEBIT); // Expecting DEBIT first (most recent)
      expect(response.body[0].paymentGateway).toBe(PaymentGateway.FAPSHI);
      expect(response.body[0].gatewayTransactionId).toBe('fapshi_tx_get2');
      expect(response.body[1].type).toBe(TransactionType.TOP_UP); // Expecting TOP_UP second
      expect(response.body[1].paymentGateway).toBe(PaymentGateway.FAPSHI);
      expect(response.body[1].gatewayTransactionId).toBe('fapshi_tx_get1');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/payments/credit-cards/${testCard.id}/transactions`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication token required.');
    });

    it('should return 404 if card not found', async () => {
      const response = await request(app)
        .get('/api/payments/credit-cards/99999/transactions') // Non-existent card ID
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Credit card not found or does not belong to user.');
    });

    it('should return 404 if card belongs to another user', async () => {
      const response = await request(app)
        .get(`/api/payments/credit-cards/${anotherUserCard.id}/transactions`)
        .set('Authorization', `Bearer ${authToken}`); // Using testUser's token

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Credit card not found or does not belong to user.');
    });
  });

});

