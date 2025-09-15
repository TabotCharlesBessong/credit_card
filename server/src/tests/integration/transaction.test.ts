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
import { CardStatus, CardType, TransactionType, TransactionStatus } from '../../constants/enums';
import bcrypt from 'bcrypt';

jest.mock('../../config/logger');
jest.mock('../../controllers/authController', () => ({
  ...jest.requireActual('../../controllers/authController'),
  sendEmail: jest.fn(),
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
  });

  afterAll(async () => {
    await sequelizeInstance.close();
    await stopServer();
    jest.restoreAllMocks();
  });

  describe('POST /api/payments/topup/mobile-money', () => {
    it('should successfully top up mobile money and create a transaction', async () => {
      const response = await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 100.00,
          description: 'Mobile money top-up',
          recipientDetails: '237678901234',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Mobile money top-up successful.');
      expect(response.body.transaction).toHaveProperty('id');
      expect(response.body.transaction.cardId).toBe(testCard.id);
      expect(response.body.transaction.amount).toBe(100); // Expecting number
      expect(response.body.transaction.type).toBe(TransactionType.TOP_UP);
      expect(response.body.transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/payments/send/mobile-money', () => {
    it('should successfully send money to mobile money and create a transaction', async () => {
      // First, ensure the card has enough balance for a debit transaction
      await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 500.00,
          description: 'Initial top-up for sending',
          recipientDetails: 'self',
        });
      testCard = (await CreditCard.findByPk(testCard.id)) as CreditCard; // Refetch card to update balance
      (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after setup

      const response = await request(app)
        .post('/api/payments/send/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 50.00,
          description: 'Send money to friend',
          recipientDetails: '237699887766',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Money sent to Mobile Money successfully.');
      expect(response.body.transaction).toHaveProperty('id');
      expect(response.body.transaction.cardId).toBe(testCard.id);
      expect(response.body.transaction.amount).toBe(50); // Expecting number
      expect(response.body.transaction.type).toBe(TransactionType.TRANSFER);
      expect(response.body.transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/payments/card/charge', () => {
    it('should successfully process a card payment and create a transaction', async () => {
      // First, ensure the card has enough balance
      await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 200.00,
          description: 'Initial top-up for payment',
          recipientDetails: 'self',
        });
      testCard = (await CreditCard.findByPk(testCard.id)) as CreditCard; // Refetch card to update balance
      (authController.sendEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/payments/card/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 75.50,
          description: 'Online purchase',
          merchant: 'Amazon',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Card payment processed successfully.');
      expect(response.body.transaction).toHaveProperty('id');
      expect(response.body.transaction.cardId).toBe(testCard.id);
      expect(response.body.transaction.amount).toBe(75.50); // Expecting number
      expect(response.body.transaction.type).toBe(TransactionType.DEBIT);
      expect(response.body.transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/credit-cards/:cardId/transactions', () => {
    let anotherUser: User;
    let anotherUserAuthToken: string;
    let anotherUserCard: CreditCard;

    beforeEach(async () => {
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

      // Create some transactions for the testUser's card
      await request(app)
        .post('/api/payments/topup/mobile-money')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 1000.00,
          description: 'Initial top-up',
          recipientDetails: 'self',
        });
      testCard = (await CreditCard.findByPk(testCard.id)) as CreditCard; // Refetch card to update balance
      await request(app)
        .post('/api/payments/card/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: testCard.id,
          amount: 150.00,
          description: 'Restaurant bill',
          merchant: 'Fancy Eats',
        });
      (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after setup
    });

    it('should return all transactions for the authenticated user\'s card', async () => {
      const response = await request(app)
        .get(`/api/payments/credit-cards/${testCard.id}/transactions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].cardId).toBe(testCard.id);
      expect(response.body[0].type).toBe(TransactionType.DEBIT); // Expecting DEBIT first
      expect(response.body[1].type).toBe(TransactionType.TOP_UP); // Expecting TOP_UP second
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
