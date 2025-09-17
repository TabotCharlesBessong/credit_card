export enum CardStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMERICAN_EXPRESS = 'american_express',
  DISCOVER = 'discover',
}

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  TOP_UP = 'top_up',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum FapshiPaymentMethod {
  MTN_MOMO = 'MTN_MOMO',
  ORANGE_MONEY = 'ORANGE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CARD',
}

export enum PaymentGateway {
  FAPSHI = 'FAPSHI',
  // Add other gateways here if needed
}