import { Sequelize } from "sequelize";
// import * as config from "../config/config.json";
import { initUser, associateUser, default as User } from "./User";
import { initToken, associateToken, default as Token } from "./Token";
import { initCreditCard, associateCreditCard, default as CreditCard } from "./CreditCard";
import { initTransaction, associateTransaction, default as Transaction } from "./Transaction";
import dotenv from "dotenv";
dotenv.config();


const dbConfig = {
  username: (process.env.DB_USER as string) || "postgres",
  password: (process.env.DB_PASSWORD as string) || "password",
  database: (process.env.DB_NAME as string) || "credit_card_db",
  host: (process.env.DB_HOST as string) || "localhost",
  dialect: (process.env.DB_DIALECT as string) || "postgres",
};

const initializeDatabase = async () => {
  let sequelizeInstance: Sequelize;

  if (process.env.NODE_ENV === 'test') {
    sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:', // Use :memory: for in-memory SQLite
      logging: false,
    });
  } else {
    sequelizeInstance = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        dialect: "postgres",
        logging: false,
      }
    );
  }

  // Initialize models
  initUser(sequelizeInstance);
  initToken(sequelizeInstance);
  initCreditCard(sequelizeInstance);
  initTransaction(sequelizeInstance);

  // Define associations
  associateUser(sequelizeInstance);
  associateToken(sequelizeInstance);
  associateCreditCard(sequelizeInstance);
  associateTransaction(sequelizeInstance);

  await sequelizeInstance.sync({ force: true }); // Use force: true for test environment to recreate tables
  console.log("Database & tables created/synced!");

  return sequelizeInstance;
};

// const env = process.env.NODE_ENV || "development";
// const dbConfig = (config as any)[env];

// Remove direct instantiation of sequelize at module level
// const sequelize = new Sequelize(
//   dbConfig.database,
//   dbConfig.username,
//   dbConfig.password,
//   {
//     host: dbConfig.host,
//     dialect: "postgres",
//     logging: false, // Set to true to see SQL queries in console
//   }
// );

// Remove direct model initialization and associations here
// initUser(sequelize);
// initToken(sequelize);
// initCreditCard(sequelize);
// initTransaction(sequelize);
// associateUser(sequelize);
// associateToken(sequelize);
// associateCreditCard(sequelize);
// associateTransaction(sequelize);

// Remove direct sync call
// sequelize
//   .sync({ alter: true })
//   .then(() => {
//     console.log("Database & tables created!");
//   })
//   .catch((error) => {
//     console.error("Error syncing database:", error);
//   });

export { User, Token, CreditCard, Transaction, initializeDatabase };
