import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, register as registerApi, activateAccount as activateAccountApi, forgotPassword as forgotPasswordApi, resetPassword as resetPasswordApi, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ActivateAccountRequest, ForgotPasswordRequest, ResetPasswordRequest, User } from '../services/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  message: string | null; // For success messages like account activation
}

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: false,
  error: null,
  message: null,
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);
      await AsyncStorage.setItem('userToken', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await registerApi(userData);
      await AsyncStorage.setItem('userToken', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const activateAccount = createAsyncThunk(
  'auth/activateAccount',
  async (data: ActivateAccountRequest, { rejectWithValue }) => {
    try {
      await activateAccountApi(data);
      return 'Account activated successfully!';
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      await forgotPasswordApi(data);
      return 'Password reset link sent to your email.';
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      await resetPasswordApi(data);
      return 'Your password has been reset successfully.';
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await AsyncStorage.removeItem('userToken');
    // Optionally clear other user-related data from AsyncStorage
  }
);

export const loadUserToken = createAsyncThunk(
  'auth/loadUserToken',
  async () => {
    const token = await AsyncStorage.getItem('userToken');
    // In a real application, you might also fetch user details based on the token here
    return token;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.message = 'Login successful!';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.token = null;
        state.user = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.message = 'Registration successful!';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.token = null;
        state.user = null;
      })
      .addCase(activateAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(activateAccount.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(activateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.error = null;
        state.isLoading = false;
        state.message = null;
      })
      .addCase(loadUserToken.fulfilled, (state, action: PayloadAction<string | null>) => {
        state.token = action.payload;
        // In a real app, if a token is loaded, you might dispatch another thunk to fetch user details
      });
  },
});

export const { clearMessages } = authSlice.actions;
export default authSlice.reducer;
