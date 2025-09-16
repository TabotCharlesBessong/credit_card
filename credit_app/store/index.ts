import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cardReducer from './cardSlice';
import transactionReducer from './transactionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    card: cardReducer,
    transaction: transactionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
