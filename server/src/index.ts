import express from "express";
import { sequelize } from "./models"; // Import sequelize

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Credit Card Application Backend is running!");
});

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
