import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cardReducer from './cardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    card: cardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
