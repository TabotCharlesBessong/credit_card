import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import cardService from '../services/card';
import { CreditCard, CreateCreditCardData } from '../types/card';

interface CardState {
  cards: CreditCard[];
  selectedCard: CreditCard | null;
  loading: boolean;
  error: string | null;
}

const initialState: CardState = {
  cards: [],
  selectedCard: null,
  loading: false,
  error: null,
};

// Async Thunks
export const createCard = createAsyncThunk(
  'card/createCard',
  async ({ cardData, token }: { cardData: CreateCreditCardData; token: string }, { rejectWithValue }) => {
    const response = await cardService.createCreditCard(cardData, token);
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as CreditCard;
  }
);

export const fetchAllCards = createAsyncThunk(
  'card/fetchAllCards',
  async (token: string, { rejectWithValue }) => {
    const response = await cardService.getAllCreditCards(token);
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as CreditCard[];
  }
);

export const fetchCardById = createAsyncThunk(
  'card/fetchCardById',
  async ({ id, token }: { id: number; token: string }, { rejectWithValue }) => {
    const response = await cardService.getCreditCardById(id, token);
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data as CreditCard;
  }
);

export const blockCard = createAsyncThunk(
  'card/blockCard',
  async ({ id, token }: { id: number; token: string }, { rejectWithValue }) => {
    const response = await cardService.blockCreditCard(id, token);
    if (response.errors) {
      return rejectWithValue(response.errors);
    }
    return response.data?.creditCard as CreditCard; // Return the updated card object
  }
);

const cardSlice = createSlice({
  name: 'card',
  initialState,
  reducers: {
    clearSelectedCard: (state) => {
      state.selectedCard = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Card
      .addCase(createCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCard.fulfilled, (state, action: PayloadAction<CreditCard>) => {
        state.loading = false;
        state.cards.push(action.payload);
      })
      .addCase(createCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch All Cards
      .addCase(fetchAllCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCards.fulfilled, (state, action: PayloadAction<CreditCard[]>) => {
        state.loading = false;
        state.cards = action.payload;
      })
      .addCase(fetchAllCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Card By Id
      .addCase(fetchCardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCardById.fulfilled, (state, action: PayloadAction<CreditCard>) => {
        state.loading = false;
        state.selectedCard = action.payload;
      })
      .addCase(fetchCardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Block Card
      .addCase(blockCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockCard.fulfilled, (state, action: PayloadAction<CreditCard>) => {
        state.loading = false;
        const index = state.cards.findIndex(card => card.id === action.payload.id);
        if (index !== -1) {
          state.cards[index] = action.payload;
        }
        if (state.selectedCard?.id === action.payload.id) {
          state.selectedCard = action.payload;
        }
      })
      .addCase(blockCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedCard } = cardSlice.actions;
export default cardSlice.reducer;
