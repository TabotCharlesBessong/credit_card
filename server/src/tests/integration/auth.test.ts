import request from 'supertest';
import app from '../../index'; // Assuming your Express app is exported as default
import { initializeDatabase, User, Token } from '../../models';
import { Sequelize } from 'sequelize';
import logger from '../../config/logger';
// import { getSendMailMock } from '../../../__mocks__/nodemailer'; // Removed as we are directly spying on sendEmail
import * as authControllerOriginal from '../../controllers/authController';

jest.mock('../../config/logger');
// No need to mock nodemailer globally here, as we are directly spying on sendEmail

let sequelizeInstance: Sequelize;
// let sendMailMock: jest.Mock; // Removed as we are directly spying on sendEmail
let compileEmailTemplateSpy: jest.SpyInstance;
let authController: typeof authControllerOriginal; // Declare authController to be assigned later

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // Ensure test environment for in-memory SQLite
    sequelizeInstance = await initializeDatabase();

    // Dynamically require authController after mocks are set up
    authController = require('../../controllers/authController');

    // Spy on sendEmail directly
    jest.spyOn(authController, 'sendEmail').mockResolvedValue(undefined);

    compileEmailTemplateSpy = jest.spyOn(authController, 'compileEmailTemplate');
    compileEmailTemplateSpy.mockResolvedValue('<h1>Mocked Email Content</h1>');
  });

  afterAll(async () => {
    await sequelizeInstance.close();
    jest.restoreAllMocks();
    // Removed: authController.setMailTransporter(null); as setMailTransporter is no longer used
  });

  beforeEach(async () => {
    // Clean up database before each test
    await sequelizeInstance.sync({ force: true });
    // Clear mocks between tests
    jest.clearAllMocks();
    (authController.sendEmail as jest.Mock).mockClear().mockResolvedValue(undefined); // Reset and clear sendEmail mock
    compileEmailTemplateSpy.mockResolvedValue('<h1>Mocked Email Content</h1>');
    // Reset environment variables if they are modified during tests
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.MAIL_HOST = 'smtp.example.com';
    process.env.MAIL_PORT = '587';
    process.env.MAIL_USER = 'user@example.com';
    process.env.MAIL_PASS = 'password';
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully. Please check your email for verification.');

      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).not.toBeNull();
      expect(user?.isVerified).toBe(false);

      const token = await Token.findOne({ where: { userId: user?.id, type: 'email_verification' } });
      expect(token).not.toBeNull();
      expect(token?.token).toHaveLength(6); // Assuming generateVerificationCode creates 6-char code

      expect(authController.sendEmail).toHaveBeenCalledTimes(1);
      expect(authController.sendEmail).toHaveBeenCalledWith(userData.email, "Account Verification", "verification_email", expect.any(Object));
    });

    it('should return 409 if email already exists', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'Password123!',
      };

      await request(app).post('/api/auth/register').send(userData);

      (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after first registration

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User with this email already exists.');
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails (e.g., weak password)', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'User',
        email: 'invalid@example.com',
        password: 'short',
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('Password must be at least 6 characters');
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    const userPassword = 'SecurePassword123!';
    const userData = {
      firstName: 'Login',
      lastName: 'User',
      email: 'login.user@example.com',
      password: userPassword,
    };

    beforeEach(async () => {
      // Clear and reset the sendEmail mock before creating a user for login tests
      (authController.sendEmail as jest.Mock).mockClear().mockResolvedValue(undefined);

      // Create a verified user for login tests
      await request(app).post('/api/auth/register').send(userData);
      const user = await User.findOne({ where: { email: userData.email } });
      if (user) {
        await user.update({ isVerified: true });
      }
      (authController.sendEmail as jest.Mock).mockClear(); // Clear mock after registration
    });

    it('should allow a verified user to login successfully and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userPassword });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'WrongPassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials.');
      expect(response.body.token).toBeUndefined();
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: userPassword });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials.');
      expect(response.body.token).toBeUndefined();
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 401 for unverified account', async () => {
      // Create an unverified user
      const unverifiedUserData = {
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified.user@example.com',
        password: userPassword,
      };
      // Ensure sendEmail mock is cleared before this registration to count calls accurately
      (authController.sendEmail as jest.Mock).mockClear();
      await request(app).post('/api/auth/register').send(unverifiedUserData);
      // sendMailMock.mockClear(); // Removed, handled by the beforeEach clear

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: unverifiedUserData.email, password: userPassword });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Account not verified. Please check your email for the verification code.');
      expect(response.body.token).toBeUndefined();
      expect(authController.sendEmail).not.toHaveBeenCalled();
    });
  });
});