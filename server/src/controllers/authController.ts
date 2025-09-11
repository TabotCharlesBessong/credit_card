import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User, { userSchema } from "../models/User";
import logger from "../config/logger";
import { Op } from "sequelize";
import nodemailer from "nodemailer";

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

// Email service
const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
    });
    logger.info(`Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
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

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
    });

    // Send verification email
    await sendEmail(
      user.email,
      "Account Verification",
      `Your verification code is: ${verificationCode}`
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

    const user = await User.findOne({ where: { email } });
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
      { expiresIn: "1h" }
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
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const resetToken = uuidv4(); // Generate a unique token
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    // Send password reset email
    await sendEmail(
      user.email,
      "Password Reset Request",
      `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n        Please click on the following link, or paste this into your browser to complete the process:\n\n        http://localhost:3000/reset-password/${resetToken}\n\n        If you did not request this, please ignore this email and your password will remain unchanged.`
    );

    logger.info(`Forgot password request for: ${user.email}`);
    res.status(200).json({ message: "Password reset email sent." });
  } catch (error: any) {
    logger.error("Error during forgot password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }, // Token not expired
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    // Validate new password using Yup (we need a separate schema for this or adjust userSchema)
    // For now, a basic check
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    // Send confirmation email
    await sendEmail(
      user.email,
      "Password Successfully Reset",
      "Your password has been successfully reset."
    );

    logger.info(`Password reset for user: ${user.email}`);
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error: any) {
    logger.error("Error during reset password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const activateAccount = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      where: { email, verificationCode: code },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email or verification code." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified." });
    }

    await user.update({
      isVerified: true,
      verificationCode: null,
    });

    // Send confirmation email
    await sendEmail(
      user.email,
      "Account Activated",
      "Your account has been successfully activated."
    );

    logger.info(`Account activated for user: ${user.email}`);
    res.status(200).json({ message: "Account activated successfully." });
  } catch (error: any) {
    logger.error("Error during account activation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
