import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User, { userSchema } from "../models/User";
import logger from "../config/logger";
import { Op } from "sequelize";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import Token from "../models/Token"; // Import Token model
import * as yup from "yup"; // Import yup for password validation

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST as string,
  port: Number(process.env.MAIL_PORT as string),
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER as string,
    pass: process.env.MAIL_PASS as string,
  },
});

const emailTemplatesPath = path.join(__dirname, "..", "email-templates");

const compileEmailTemplate = async (templateName: string, context: Record<string, string>): Promise<string> => {
  const templatePath = path.join(emailTemplatesPath, `${templateName}.html`);
  let html = await fs.readFile(templatePath, "utf8");

  for (const key in context) {
    if (Object.prototype.hasOwnProperty.call(context, key)) {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), context[key]);
    }
  }
  return html;
};
// Email service
export const sendEmail = async (to: string, subject: string, template: string, context: Record<string, string>) => {
  try {
    const htmlContent = await compileEmailTemplate(template, context);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
    });
    logger.info(`Email sent to ${to} with subject: ${subject} using template ${template}.`);
  } catch (error) {
    logger.error(`Failed to send email to ${to} using template ${template}:`, error);
  }
};

// Utility to generate a verification code
const generateVerificationCode = (): string => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const register = async (req: Request, res: Response) => {
  try {
    await userSchema.validate(req.body, { abortEarly: false });
    const { firstName, lastName, email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const existingUser = await User.findOne({ where: { email: lowerCaseEmail } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email: lowerCaseEmail,
      password: hashedPassword,
      isVerified: false,
    });

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await Token.create({
      userId: user.id,
      token: verificationCode,
      type: 'email_verification',
      expiresAt,
    });

    // Send verification email
    await sendEmail(
      user.email,
      "Account Verification",
      "verification_email",
      {
        USER_NAME: user.firstName,
        VERIFICATION_CODE: verificationCode,
        VERIFICATION_URL: `${process.env.CLIENT_URL}/activate-account?email=${user.email}&code=${verificationCode}`,
        APP_NAME: "Credit Card App",
        YEAR: new Date().getFullYear().toString(),
      }
    );

    logger.info(`User registered: ${user.email}`);
    res
      .status(201)
      .json({
        message:
          "User registered successfully. Please check your email for verification.",
      });
  } catch (error: any) {
    logger.error("Error during registration:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ where: { email: lowerCaseEmail } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({
          message:
            "Account not verified. Please check your email for the verification code.",
        });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    logger.info(`User logged in: ${user.email}`);
    res.status(200).json({ token });
  } catch (error: any) {
    logger.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  // For JWT, logout is primarily handled client-side by discarding the token.
  // On the server, we might blacklist tokens or simply acknowledge the logout.
  // For simplicity, we'll just send a success message for now.
  logger.info("User logged out (client-side token discard assumed).");
  res.status(200).json({ message: "Logged out successfully." });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    logger.info(`Forgot password request for email: ${lowerCaseEmail}`);
    const user = await User.findOne({ where: { email: lowerCaseEmail } });
    logger.info(`User found for forgot password: ${user ? user.email : "None"}`);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const resetCode = generateVerificationCode(); // Generate a unique code
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await Token.create({
      userId: user.id,
      token: resetCode,
      type: 'password_reset',
      expiresAt,
    });

    // Send password reset email
    await sendEmail(
      user.email,
      "Password Reset Request",
      "reset_password_email",
      {
        USER_NAME: user.firstName,
        RESET_PASSWORD_URL: `${process.env.CLIENT_URL}/reset-password?email=${user.email}&code=${resetCode}`,
        APP_NAME: "Credit Card App",
        YEAR: new Date().getFullYear().toString(),
      }
    );

    logger.info(`Forgot password request for: ${user.email}`);
    res.status(200).json({ message: "Password reset code sent to your email." });
  } catch (error: any) {
    logger.error("Error during forgot password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    logger.info(`Reset password request for email: ${lowerCaseEmail} with code: ${code}`);

    const tokenEntry = await Token.findOne({
      where: {
        token: code,
        type: 'password_reset',
        expiresAt: { [Op.gt]: new Date() }, // Token not expired
      },
      include: [{ model: User, as: 'user', where: { email: lowerCaseEmail } }],
    });

    if (!tokenEntry) {
      return res.status(400).json({ message: "Password reset code is invalid or has expired." });
    }

    const user = tokenEntry.user;
    logger.info(`User found for reset password: ${user ? user.email : "None"}`);

    if (!user) {
      // This case should ideally not happen if tokenEntry has a user, but good for safety
      return res.status(404).json({ message: "User not found for this token." });
    }

    // Validate new password using Yup
    const passwordSchema = yup.object().shape({
      newPassword: yup.string().min(6, 'New password must be at least 6 characters').required('New password is required'),
    });
    await passwordSchema.validate({ newPassword }, { abortEarly: false });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      isVerified: true, // Also verify account if password reset is successful
    });

    // Invalidate the token after use
    await tokenEntry.destroy();

    // Send confirmation email
    await sendEmail(
      user.email,
      "Password Successfully Reset",
      "generic_success_email",
      {
        USER_NAME: user.firstName,
        MESSAGE: "Your password has been successfully reset.",
        APP_NAME: "Credit Card App",
        YEAR: new Date().getFullYear().toString(),
      }
    );

    logger.info(`Password reset for user: ${user.email}`);
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error: any) {
    logger.error("Error during reset password:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const activateAccount = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    logger.info(`Account activation request for email: ${lowerCaseEmail} with code: ${code}`);

    const tokenEntry = await Token.findOne({
      where: {
        token: code,
        type: 'email_verification',
        expiresAt: { [Op.gt]: new Date() }, // Token not expired
      },
      include: [{ model: User, as: 'user', where: { email: lowerCaseEmail } }],
    });

    if (!tokenEntry) {
      return res.status(400).json({ message: "Invalid email or verification code, or it has expired." });
    }

    const user = tokenEntry.user;

    if (!user) {
      return res.status(404).json({ message: "User not found for this verification code." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified." });
    }

    await user.update({
      isVerified: true,
    });

    // Invalidate the token after use
    await tokenEntry.destroy();

    // Send confirmation email
    await sendEmail(
      user.email,
      "Account Activated",
      "generic_success_email",
      {
        USER_NAME: user.firstName,
        MESSAGE: "Your account has been successfully activated.",
        APP_NAME: "Credit Card App",
        YEAR: new Date().getFullYear().toString(),
      }
    );

    logger.info(`Account activated for user: ${user.email}`);
    res.status(200).json({ message: "Account activated successfully." });
  } catch (error: any) {
    logger.error("Error during account activation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
