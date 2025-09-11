import express from "express";
import { sequelize } from "./models"; // Import sequelize
import logger from "./config/logger"; // Import logger
import authRoutes from "./routes/auth"; // Import authentication routes
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("Credit Card Application Backend is running!");
});

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    logger.info("Database connection has been established successfully.");
  })
  .catch((err) => {
    logger.error("Unable to connect to the database:", err);
  });

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
