import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/forms/FormikTextInput';
import FormikPasswordInput from '@/components/forms/FormikPasswordInput';
import { ThemedText } from '@/components/themed-text';
import Card from '@/components/ui/Card';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const SignInScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (values: typeof LoginSchema.initialValues) => {
    const resultAction = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(resultAction)) {
      router.replace('/(tabs)');
    } else if (loginUser.rejected.match(resultAction)) {
      Alert.alert('Login Failed', resultAction.payload as string);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Card style={styles.card}>
        <ThemedText type="title" style={styles.title}>Sign In</ThemedText>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ handleSubmit }) => (
            <View>
              <FormikTextInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
              />
              <FormikPasswordInput
                name="password"
                label="Password"
                placeholder="Enter your password"
              />
              {error && <ThemedText style={styles.errorText} type="caption">{error}</ThemedText>}
              <Button title={isLoading ? 'Logging In...' : 'Login'} onPress={handleSubmit} disabled={isLoading} />
              <Button title="Don't have an account? Sign Up" onPress={() => router.push('/auth/sign-up')} color="gray" />
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
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default SignInScreen;
