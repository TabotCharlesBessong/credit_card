import express from "express";
import { initializeDatabase } from "./models"; // Import initializeDatabase
import logger from "./config/logger"; // Import logger
import authRoutes from "./routes/auth"; // Import authentication routes
import cardRoutes from "./routes/cardRoutes"; // Import card routes
import paymentRoutes from "./routes/paymentRoutes"; // Import payment routes
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/credit-cards', cardRoutes);
app.use('/api/payments', paymentRoutes);

app.get("/", (req, res) => {
  res.send("Credit Card Application Backend is running!");
});

const startServer = async () => {
  try {
    const sequelize = await initializeDatabase();
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    if (process.env.NODE_ENV !== 'test') {
      app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
      });
    }
  } catch (err) {
    logger.error("Unable to connect to the database or start server:", err);
    process.exit(1);
  }
};

startServer();

export default app;
