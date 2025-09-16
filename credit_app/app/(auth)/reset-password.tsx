import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormikPasswordInput from '@/components/forms/FormikPasswordInput';
import { ThemedText } from '@/components/themed-text';
import Card from '@/components/ui/Card';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearMessages } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store';
import { ResetPasswordRequest } from '@/services/auth';

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

const ResetPasswordScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, message } = useSelector((state: RootState) => state.auth);
  const { token } = useLocalSearchParams();
  const [resetAttempted, setResetAttempted] = useState(false);

  const initialValues: ResetPasswordRequest & { confirmPassword: string } = {
    token: '',
    password: '',
    confirmPassword: '',
  };

  const handleResetPassword = async (values: ResetPasswordRequest & { confirmPassword: string }) => {
    if (!token) {
      Alert.alert('Error', 'No reset token found.');
      return;
    }
    setResetAttempted(true);
    const resultAction = await dispatch(resetPassword({ token: token as string, password: values.password, confirmPassword: values.confirmPassword }));
    if (resetPassword.fulfilled.match(resultAction)) {
      Alert.alert('Success', resultAction.payload as string, [
        { text: 'OK', onPress: () => (router.replace as any)('/auth/sign-in') },
      ]);
    } else if (resetPassword.rejected.match(resultAction)) {
      Alert.alert('Error', resultAction.payload as string);
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    // If there's no token, redirect to forgot password
    if (!token && !isLoading && resetAttempted) {
      Alert.alert('Invalid Token', 'No reset token found or it has expired. Please request a new password reset link.', [
        { text: 'OK', onPress: () => (router.replace as any)('/auth/forgot-password') },
      ]);
    }
  }, [token, isLoading, resetAttempted]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Card style={styles.card}>
        <ThemedText type="title" style={styles.title}>Reset Password</ThemedText>
        {!token && (
          <ThemedText style={styles.infoText} type="caption">
            No reset token found. Please check your email for the reset link.
          </ThemedText>
        )}
        {token && (
          <Formik
            initialValues={initialValues}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleResetPassword}
          >
            {({ handleSubmit }) => (
              <View>
                <FormikPasswordInput
                  name="password"
                  label="New Password"
                  placeholder="Enter your new password"
                />
                <FormikPasswordInput
                  name="confirmPassword"
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                />
                {error && <ThemedText style={styles.errorText} type="caption">{error}</ThemedText>}
                {message && <ThemedText style={styles.successText} type="caption">{message}</ThemedText>}
                <Button title={isLoading ? 'Resetting...' : 'Reset Password'} onPress={() => handleSubmit()} disabled={isLoading} />
              </View>
            )}
          </Formik>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    marginBottom: 10,
    textAlign: 'center',
    color: '#666',
  },
});

export default ResetPasswordScreen;
