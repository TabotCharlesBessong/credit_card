import React from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/forms/FormikTextInput';
import FormikPasswordInput from '@/components/forms/FormikPasswordInput';
import { ThemedText } from '@/components/themed-text';
import Card from '@/components/ui/Card';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store';
import { RegisterRequest } from '@/services/auth';

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string().required('First Name is required'),
  lastName: Yup.string().required('Last Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

const SignUpScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const initialValues: RegisterRequest & { confirmPassword: string } = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const handleRegister = async (values: RegisterRequest & { confirmPassword: string }) => {
    const { firstName, lastName, email, password } = values; // Destructure to exclude confirmPassword
    const resultAction = await dispatch(registerUser({ firstName, lastName, email, password }));
    if (registerUser.fulfilled.match(resultAction)) {
      (router.replace as any)('/(tabs)'); // Cast to any to bypass type error
    } else if (registerUser.rejected.match(resultAction)) {
      Alert.alert('Registration Failed', resultAction.payload as string);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Card style={styles.card}>
        <ThemedText type="title" style={styles.title}>Sign Up</ThemedText>
        <Formik
          initialValues={initialValues}
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}
        >
          {({ handleSubmit }) => (
            <View>
              <FormikTextInput name="firstName" label="First Name" placeholder="Enter your first name" />
              <FormikTextInput name="lastName" label="Last Name" placeholder="Enter your last name" />
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
              <FormikPasswordInput
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
              />
              {error && <ThemedText style={styles.errorText} type="caption">{error}</ThemedText>}
              <Button title={isLoading ? 'Registering...' : 'Register'} onPress={() => handleSubmit()} disabled={isLoading} />
              <Button title="Already have an account? Sign In" onPress={() => router.push('/(auth)/sign-in')} color="gray" />
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

export default SignUpScreen;
