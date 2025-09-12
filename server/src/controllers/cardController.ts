import { Request, Response } from 'express';
import CreditCard, { creditCardSchema } from '../models/CreditCard';
import { CardStatus, CardType } from '../constants/enums';
import logger from '../config/logger';
import User from '../models/User'; // To get user details for email
import { sendEmail } from './authController'; // Re-using sendEmail utility

// Placeholder for encryption/decryption utilities (Week 1, 2.3 Data Encryption)
export const encryptCardNumber = (cardNumber: string): string => {
  // In a real application, use a robust encryption library and method
  // For now, a simple base64 encoding or similar placeholder
  logger.warn("Card number encryption is a placeholder. Implement robust encryption.");
  return Buffer.from(cardNumber).toString('base64');
};

export const decryptCardNumber = (encryptedCardNumber: string): string => {
  logger.warn("Card number decryption is a placeholder. Implement robust decryption.");
  return Buffer.from(encryptedCardNumber, 'base64').toString('utf8');
};

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const createCreditCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    await creditCardSchema.validate(req.body, { abortEarly: false });
    const { cardNumber, cardHolderName, expiryMonth, expiryYear, creditLimit } = req.body;

    // Encrypt card number before storing
    const encryptedCardNumber = encryptCardNumber(cardNumber);

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Authenticated user not found.' });
    }

    const creditCard = await CreditCard.create({
      userId: req.user.id,
      cardNumber: encryptedCardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      creditLimit,
      currentBalance: 0.0, // New card starts with 0 balance
      status: CardStatus.PENDING, // New cards are pending by default
      cardType: CardType.VISA, // Placeholder, implement logic to derive from card number
    });

    // Send new card created email
    await sendEmail(
      user.email,
      "New Credit Card Created",
      "new_card_created",
      {
        USER_NAME: user.firstName,
        CARD_TYPE: creditCard.cardType,
        LAST_FOUR_DIGITS: cardNumber.slice(-4),
        CREDIT_LIMIT: creditCard.creditLimit.toFixed(2),
        APP_NAME: "Credit Card App",
        YEAR: new Date().getFullYear().toString(),
      }
    );

    logger.info(`Credit card created for user ${req.user.email}: ****${cardNumber.slice(-4)}`);
    res.status(201).json(creditCard);
  } catch (error: any) {
    logger.error('Error creating credit card:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllCreditCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const creditCards = await CreditCard.findAll({ where: { userId: req.user.id } });

    // Decrypt card numbers for display (careful with sensitive data on frontend)
    const decryptedCards = creditCards.map(card => ({
      ...card.toJSON(),
      cardNumber: decryptCardNumber(card.cardNumber).replace(/(\d{4}(?!$))/g, '**** '), // Mask all but last 4
    }));

    logger.info(`Fetched all credit cards for user ${req.user.email}.`);
    res.status(200).json(decryptedCards);
  } catch (error: any) {
    logger.error('Error fetching credit cards:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCreditCardById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const { id } = req.params;
    const creditCard = await CreditCard.findOne({ where: { id, userId: req.user.id } });

    if (!creditCard) {
      return res.status(404).json({ message: 'Credit card not found.' });
    }

    // Decrypt card number for display
    const decryptedCard = {
      ...creditCard.toJSON(),
      cardNumber: decryptCardNumber(creditCard.cardNumber).replace(/(\d{4}(?!$))/g, '**** '),
    };

    logger.info(`Fetched credit card ${id} for user ${req.user.email}.`);
    res.status(200).json(decryptedCard);
  } catch (error: any) {
    logger.error(`Error fetching credit card by ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const blockCreditCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const { id } = req.params;
    const creditCard = await CreditCard.findOne({ where: { id, userId: req.user.id } });

    if (!creditCard) {
      return res.status(404).json({ message: 'Credit card not found.' });
    }

    await creditCard.update({ status: CardStatus.BLOCKED });

    const user = await User.findByPk(req.user.id);
    if (user) {
      // Send card blocked email
      await sendEmail(
        user.email,
        "Credit Card Blocked",
        "card_blocked",
        {
          USER_NAME: user.firstName,
          CARD_TYPE: creditCard.cardType,
          LAST_FOUR_DIGITS: decryptCardNumber(creditCard.cardNumber).slice(-4),
          APP_NAME: "Credit Card App",
          YEAR: new Date().getFullYear().toString(),
        }
      );
    }

    logger.info(`Credit card ${id} blocked for user ${req.user.email}.`);
    res.status(200).json({ message: 'Credit card blocked successfully.', creditCard });
  } catch (error: any) {
    logger.error(`Error blocking credit card ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
