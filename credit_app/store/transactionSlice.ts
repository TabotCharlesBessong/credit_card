import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import transactionService from "../services/transaction";
import {
  Transaction,
  TopUpData,
  SendMoneyData,
  CardPaymentData,
  TransactionResult,
} from "../types/transaction";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
};

// Async Thunks for top-up operations
export const topUpMobileMoney = createAsyncThunk(
  "transaction/topUpMobileMoney",
  async (
    { topUpData, token }: { topUpData: TopUpData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.topUpMobileMoney(
      topUpData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

export const topUpOrangeMoney = createAsyncThunk(
  "transaction/topUpOrangeMoney",
  async (
    { topUpData, token }: { topUpData: TopUpData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.topUpOrangeMoney(
      topUpData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

export const topUpBankAccount = createAsyncThunk(
  "transaction/topUpBankAccount",
  async (
    { topUpData, token }: { topUpData: TopUpData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.topUpBankAccount(
      topUpData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

// Async Thunks for send money operations
export const sendToMobileMoney = createAsyncThunk(
  "transaction/sendToMobileMoney",
  async (
    { sendMoneyData, token }: { sendMoneyData: SendMoneyData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.sendToMobileMoney(
      sendMoneyData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

export const sendToOrangeMoney = createAsyncThunk(
  "transaction/sendToOrangeMoney",
  async (
    { sendMoneyData, token }: { sendMoneyData: SendMoneyData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.sendToOrangeMoney(
      sendMoneyData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

export const sendToBankAccount = createAsyncThunk(
  "transaction/sendToBankAccount",
  async (
    { sendMoneyData, token }: { sendMoneyData: SendMoneyData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.sendToBankAccount(
      sendMoneyData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

// Async Thunk for card payment
export const processCardPayment = createAsyncThunk(
  "transaction/processCardPayment",
  async (
    {
      cardPaymentData,
      token,
    }: { cardPaymentData: CardPaymentData; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.processCardPayment(
      cardPaymentData,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as TransactionResult;
  }
);

// Async Thunk for fetching card transactions
export const fetchCardTransactions = createAsyncThunk(
  "transaction/fetchCardTransactions",
  async (
    { cardId, token }: { cardId: number; token: string },
    { rejectWithValue }
  ) => {
    const response = await transactionService.fetchCardTransactions(
      cardId,
      token
    );
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as Transaction[];
  }
);

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Top Up Mobile Money
      .addCase(topUpMobileMoney.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        topUpMobileMoney.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
          // Optionally add the new transaction to a list or update card balance
        }
      )
      .addCase(topUpMobileMoney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Top Up Orange Money
      .addCase(topUpOrangeMoney.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        topUpOrangeMoney.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
        }
      )
      .addCase(topUpOrangeMoney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Top Up Bank Account
      .addCase(topUpBankAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        topUpBankAccount.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
        }
      )
      .addCase(topUpBankAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send To Mobile Money
      .addCase(sendToMobileMoney.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        sendToMobileMoney.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
        }
      )
      .addCase(sendToMobileMoney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send To Orange Money
      .addCase(sendToOrangeMoney.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        sendToOrangeMoney.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
        }
      )
      .addCase(sendToOrangeMoney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send To Bank Account
      .addCase(sendToBankAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        sendToBankAccount.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
        }
      )
      .addCase(sendToBankAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Process Card Payment
      .addCase(processCardPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        processCardPayment.fulfilled,
        (state, action: PayloadAction<TransactionResult>) => {
          state.loading = false;
        }
      )
      .addCase(processCardPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Card Transactions
      .addCase(fetchCardTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCardTransactions.fulfilled,
        (state, action: PayloadAction<Transaction[]>) => {
          state.loading = false;
          state.transactions = action.payload;
        }
      )
      .addCase(fetchCardTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionSlice.reducer;
