import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/forms/FormikTextInput';
import { ThemedText } from '@/components/themed-text';
import Card from '@/components/ui/Card';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearMessages } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, message } = useSelector((state: RootState) => state.auth);

  const handleForgotPassword = async (values: typeof ForgotPasswordSchema.initialValues) => {
    const resultAction = await dispatch(forgotPassword(values));
    if (forgotPassword.fulfilled.match(resultAction)) {
      Alert.alert('Success', resultAction.payload as string, [
        { text: 'OK', onPress: () => router.replace('/auth/sign-in') },
      ]);
    } else if (forgotPassword.rejected.match(resultAction)) {
      Alert.alert('Error', resultAction.payload as string);
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Card style={styles.card}>
        <ThemedText type="title" style={styles.title}>Forgot Password</ThemedText>
        <ThemedText style={styles.subtitle} type="caption">
          Enter your email address to receive a password reset link.
        </ThemedText>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleForgotPassword}
        >
          {({ handleSubmit }) => (
            <View>
              <FormikTextInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
              />
              {error && <ThemedText style={styles.errorText} type="caption">{error}</ThemedText>}
              {message && <ThemedText style={styles.successText} type="caption">{message}</ThemedText>}
              <Button title={isLoading ? 'Sending...' : 'Send Reset Link'} onPress={handleSubmit} disabled={isLoading} />
              <Button title="Back to Sign In" onPress={() => router.push('/auth/sign-in')} color="gray" />
            </View>
          )}
        </Formik>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
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
});

export default ForgotPasswordScreen;
