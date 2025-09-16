import { mocked } from 'jest-mock';

const createTransport = jest.fn().mockReturnValue({
  sendMail: jest.fn(),
});

const nodemailer = {
  createTransport,
};

export default nodemailer;

export const __esModule = true;

export const getMockTransporter = () => mocked(createTransport.mock.results[0].value);
export const getSendMailMock = () => mocked(createTransport.mock.results[0].value.sendMail);
