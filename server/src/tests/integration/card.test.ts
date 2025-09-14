process.env.JWT_SECRET = 'test-jwt-secret'; // Ensure JWT_SECRET is set early
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

process.env.NODE_ENV = 'test';

import request from 'supertest';
import { app, startServer, stopServer } from '../../index';
import { initializeDatabase, User, CreditCard } from '../../models';
import { Sequelize } from 'sequelize';
import logger from '../../config/logger';
import * as authController from '../../controllers/authController'; // Import authController to mock sendEmail
import { CardStatus, CardType } from '../../constants/enums';
import bcrypt from 'bcrypt'; // Import bcrypt

jest.mock('../../config/logger');
jest.mock('../../controllers/authController', () => ({
  ...jest.requireActual('../../controllers/authController'),
  sendEmail: jest.fn(),
}));

let sequelizeInstance: Sequelize;
let authToken: string;
let testUser: User;

describe('Credit Card Integration Tests', () => {
  beforeAll(async () => {
    sequelizeInstance = await initializeDatabase();
    await startServer(); // Start the server before all tests

    // Create a test user for authentication
    const hashedPassword = await bcrypt.hash('Password123!', 10); // Hash password
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'cardtest@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    // Generate a token for the test user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'Password123!' });
    authToken = loginResponse.body.token;
  });

  beforeEach(async () => {
    await sequelizeInstance.sync({ force: true });
    jest.clearAllMocks();
    // Recreate test user and token because sync({force:true}) clears everything
    const hashedPassword = await bcrypt.hash('Password123!', 10); // Hash password
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'cardtest@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'Password123!' });
    authToken = loginResponse.body.token;
    (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after setup
  });

  afterAll(async () => {
    await sequelizeInstance.close();
    await stopServer(); // Stop the server after all tests
    jest.restoreAllMocks();
  });

  describe('POST /api/credit-cards', () => {
    it('should create a credit card successfully', async () => {
      const cardData = {
        cardNumber: '1234567890123456',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 10000.00,
      };

      const response = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cardData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.status).toBe(CardStatus.PENDING);
      expect(response.body.cardNumber).not.toBe(cardData.cardNumber); // Should be encrypted
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
      expect(authController.sendEmail).toHaveBeenCalledWith(
        testUser.email,
        'New Credit Card Created',
        'new_card_created',
        expect.any(Object)
      );
    });

    it('should return 401 if unauthenticated', async () => {
      const cardData = {
        cardNumber: '1234567890123456',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 10000.00,
      };

      const response = await request(app)
        .post('/api/credit-cards')
        .send(cardData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication token required.');
      expect(CreditCard.count()).resolves.toBe(0);
    });

    it('should return 400 if validation fails', async () => {
      const cardData = {
        cardNumber: '123', // Invalid
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 10000.00,
      };

      const response = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cardData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('Card number must be 16 digits');
      expect(CreditCard.count()).resolves.toBe(0);
    });

    it('should return 409 if card number already exists', async () => {
      const cardData = {
        cardNumber: '1234567890123456',
        expiryMonth: '12',
        expiryYear: '2025',
        creditLimit: 10000.00,
      };

      // Create card once
      await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cardData);
      (authController.sendEmail as jest.Mock).mockClear(); // Clear email mock after first creation

      // Attempt to create again
      const response = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cardData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Credit card with this number already exists.');
      expect(CreditCard.count()).resolves.toBe(1); // Only one card should exist
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/credit-cards', () => {
    it('should return all credit cards for the authenticated user', async () => {
      // Create a card first
      await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardNumber: '1111222233334444',
          expiryMonth: '11',
          expiryYear: '2024',
          creditLimit: 2000.00,
        });
      (authController.sendEmail as jest.Mock).mockClear();

      const response = await request(app)
        .get('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].userId).toBe(testUser.id);
      expect(response.body[0].cardNumber).toBe('**** **** **** 4444'); // Should be masked
      expect(response.body[0].status).toBe(CardStatus.PENDING);
      expect(response.body[0].user.email).toBe(testUser.email);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).get('/api/credit-cards');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication token required.');
    });

    it('should return an empty array if no cards found', async () => {
      const response = await request(app)
        .get('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/credit-cards/:id', () => {
    let cardId: number;

    beforeEach(async () => {
      // Create a card for testing
      const createResponse = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardNumber: '5555666677778888',
          expiryMonth: '10',
          expiryYear: '2026',
          creditLimit: 7500.00,
        });
      cardId = createResponse.body.id;
      (authController.sendEmail as jest.Mock).mockClear(); // Clear email mock after setup
    });

    it('should return a specific credit card by ID', async () => {
      const response = await request(app)
        .get(`/api/credit-cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', cardId);
      expect(response.body.cardNumber).toBe('**** **** **** 8888'); // Masked
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).get(`/api/credit-cards/${cardId}`);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication token required.');
    });

    it('should return 404 if credit card not found', async () => {
      const response = await request(app)
        .get('/api/credit-cards/99999') // Non-existent ID
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Credit card not found.');
    });

    it('should return 404 if credit card belongs to another user', async () => {
      // Create another user
      const anotherUserPassword = await bcrypt.hash('SecurePass123!', 10); // Hash password
      const anotherUser = await User.create({
        firstName: 'Another',
        lastName: 'User',
        email: 'anothercarduser@example.com',
        password: anotherUserPassword,
        isVerified: true,
      });

      const anotherUserLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: anotherUser.email, password: 'SecurePass123!' });
      const anotherUserToken = anotherUserLogin.body.token;

      const response = await request(app)
        .get(`/api/credit-cards/${cardId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Credit card not found.');
    });
  });

  describe('PUT /api/credit-cards/:id/block', () => {
    let cardId: number;

    beforeEach(async () => {
      // Create a card for testing
      const createResponse = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardNumber: '9999888877776666',
          expiryMonth: '09',
          expiryYear: '2027',
          creditLimit: 15000.00,
        });
      cardId = createResponse.body.id;
      (authController.sendEmail as jest.Mock).mockClear(); // Clear email mock after setup
    });

    it('should block a credit card successfully', async () => {
      const response = await request(app)
        .put(`/api/credit-cards/${cardId}/block`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Credit card blocked successfully.');
      expect(response.body.creditCard.status).toBe(CardStatus.BLOCKED);
      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
      expect(authController.sendEmail).toHaveBeenCalledWith(
        testUser.email,
        'Credit Card Blocked',
        'card_blocked',
        expect.any(Object)
      );
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).put(`/api/credit-cards/${cardId}/block`);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication token required.');
    });

    it('should return 404 if credit card not found', async () => {
      const response = await request(app)
        .put('/api/credit-cards/99999/block') // Non-existent ID
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Credit card not found.');
    });

    it('should return 404 if credit card belongs to another user', async () => {
      // Create another user
      const anotherUserPassword = await bcrypt.hash('SecurePass123!', 10); // Hash password
      const anotherUser = await User.create({
        firstName: 'Another',
        lastName: 'User',
        email: 'anotherblockuser@example.com',
        password: anotherUserPassword,
        isVerified: true,
      });

      const anotherUserLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: anotherUser.email, password: 'SecurePass123!' });
      const anotherUserToken = anotherUserLogin.body.token;

      const response = await request(app)
        .put(`/api/credit-cards/${cardId}/block`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Credit card not found.');
    });
  });
});
