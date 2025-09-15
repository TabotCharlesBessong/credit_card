import logger from '../../config/logger';
import * as authController from '../../controllers/authController';

jest.mock('../../config/logger');

describe('generateVerificationCode', () => {
  it('should generate a 6-character alphanumeric code', () => {
    const code = authController.generateVerificationCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[0-9A-Z]{6}$/);
  });

  it('should generate different codes on subsequent calls', () => {
    const code1 = authController.generateVerificationCode();
    const code2 = authController.generateVerificationCode();
    expect(code1).not.toEqual(code2);
  });
});

describe('compileEmailTemplate', () => {
  const mockFs = {
    readFile: jest.fn(),
  } as any;

  beforeEach(() => {
    mockFs.readFile.mockClear();
  });

  it('should compile a template with context variables', async () => {
    mockFs.readFile.mockResolvedValueOnce('Hello {{USER_NAME}}, your code is {{VERIFICATION_CODE}}.');
    const context = { USER_NAME: 'John Doe', VERIFICATION_CODE: '123456' };
    const html = await authController.compileEmailTemplate('test_template', context, mockFs);
    expect(html).toBe('Hello John Doe, your code is 123456.');
    expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    expect(mockFs.readFile).toHaveBeenCalledWith(expect.stringContaining('test_template.html'), 'utf8');
  });

  it('should return the template as is if no context variables are provided', async () => {
    mockFs.readFile.mockResolvedValueOnce('Hello, this is a test template.');
    const context = {};
    const html = await authController.compileEmailTemplate('test_template', context, mockFs);
    expect(html).toBe('Hello, this is a test template.');
    expect(mockFs.readFile).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple occurrences of the same variable', async () => {
    mockFs.readFile.mockResolvedValueOnce('{{USER_NAME}} hello, {{USER_NAME}} again.');
    const context = { USER_NAME: 'Jane Doe' };
    const html = await authController.compileEmailTemplate('test_template', context, mockFs);
    expect(html).toBe('Jane Doe hello, Jane Doe again.');
  });

  it('should throw an error if the template file cannot be read', async () => {
    mockFs.readFile.mockRejectedValueOnce(new Error('File not found'));
    const context = {};
    await expect(authController.compileEmailTemplate('non_existent_template', context, mockFs)).rejects.toThrow('File not found');
  });
});

describe('sendEmail', () => {
  let sendMailMock: jest.Mock;
  let compileEmailTemplateSpy: jest.SpyInstance;
  let getMailTransporterSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    sendMailMock = jest.fn().mockResolvedValue({});
    getMailTransporterSpy = jest.spyOn(authController, 'getMailTransporter').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    compileEmailTemplateSpy = jest.spyOn(authController, 'compileEmailTemplate');
    compileEmailTemplateSpy.mockResolvedValue('<h1>Mocked Email Content</h1>');

    process.env.EMAIL_FROM = 'test@example.com';
    process.env.MAIL_HOST = 'smtp.example.com';
    process.env.MAIL_PORT = '587';
    process.env.MAIL_USER = 'user@example.com';
    process.env.MAIL_PASS = 'password';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send an email successfully and log info', async () => {
    await authController.sendEmail('recipient@test.com', 'Test Subject', 'test_template', { USER_NAME: 'Test User' });

    expect(compileEmailTemplateSpy).toHaveBeenCalledTimes(1);
    expect(compileEmailTemplateSpy).toHaveBeenCalledWith('test_template', { USER_NAME: 'Test User' });
    expect(getMailTransporterSpy).toHaveBeenCalledTimes(1);
    expect(getMailTransporterSpy).toHaveBeenCalledWith(); // Expect no arguments as it's a simple getter
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'recipient@test.com',
      subject: 'Test Subject',
      html: '<h1>Mocked Email Content</h1>',
    });
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Email sent to recipient@test.com with subject: Test Subject using template test_template.');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log an error if sending email fails', async () => {
    const error = new Error('Failed to send');
    sendMailMock.mockRejectedValueOnce(error);

    await authController.sendEmail('recipient@test.com', 'Test Subject', 'test_template', { USER_NAME: 'Test User' });

    expect(compileEmailTemplateSpy).toHaveBeenCalledTimes(1);
    expect(getMailTransporterSpy).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Failed to send email to recipient@test.com using template test_template:', error);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should use the default transporter if none is provided', async () => {
    compileEmailTemplateSpy.mockResolvedValueOnce('<h1>Default Transporter Test</h1>');

    await authController.sendEmail('recipient@default.com', 'Default Subject', 'default_template', { USER_NAME: 'Default User' });

    expect(compileEmailTemplateSpy).toHaveBeenCalledTimes(1);
    expect(getMailTransporterSpy).toHaveBeenCalledTimes(1);
    expect(getMailTransporterSpy).toHaveBeenCalledWith();
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'recipient@default.com',
      subject: 'Default Subject',
      html: '<h1>Default Transporter Test</h1>',
    });
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
