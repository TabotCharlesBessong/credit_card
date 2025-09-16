import express from "express";
import { initializeDatabase } from "./models"; // Import initializeDatabase
import logger from "./config/logger"; // Import logger
import authRoutes from "./routes/auth"; // Import authentication routes
import cardRoutes from "./routes/cardRoutes"; // Import card routes
import paymentRoutes from "./routes/paymentRoutes"; // Import payment routes
import dotenv from "dotenv";
import { Server } from "http";

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

let server: Server;

const startServer = async (): Promise<Server> => {
  try {
    const sequelize = await initializeDatabase();
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    return new Promise((resolve) => {
      server = app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
        resolve(server);
      });
    });
  } catch (err) {
    logger.error("Unable to connect to the database or start server:", err);
    process.exit(1);
  }
};

const stopServer = async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error("Error stopping server:", err);
          return reject(err);
        }
        logger.info("Server stopped.");
        resolve();
      });
    });
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer, stopServer };
