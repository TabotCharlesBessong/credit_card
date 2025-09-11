import { Sequelize } from "sequelize";
// import * as config from "../config/config.json";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  username: (process.env.DB_USER as string) || "postgres",
  password: (process.env.DB_PASSWORD as string) || "password",
  database: (process.env.DB_NAME as string) || "credit_card_db",
  host: (process.env.DB_HOST as string) || "localhost",
  dialect: (process.env.DB_DIALECT as string) || "postgres",
};

// const env = process.env.NODE_ENV || "development";
// const dbConfig = (config as any)[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: "postgres",
    logging: false, // Set to true to see SQL queries in console
  }
);

export { sequelize };
