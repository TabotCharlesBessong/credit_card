import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import Card from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import FormikTextInput from '@/components/forms/FormikTextInput';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ProfileScreen = () => {
  const initialValues = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
  };

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required('Full Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
  });

  return (
    <ScrollView style={styles.scrollViewContent}>
      <View style={styles.container}>
        <ThemedText type="title">Profile Screen</ThemedText>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Personal Information</ThemedText>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => console.log('Profile Updated:', values)}
          >
            {({ handleSubmit }) => (
              <View>
                <FormikTextInput name="fullName" label="Full Name" placeholder="Enter your full name" />
                <FormikTextInput name="email" label="Email" placeholder="Enter your email" keyboardType="email-address" />
                <FormikTextInput name="phone" label="Phone" placeholder="Enter your phone number" keyboardType="phone-pad" />
                <Button title="Update Profile" onPress={handleSubmit} />
              </View>
            )}
          </Formik>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Account Details</ThemedText>
          <ThemedText type="default">Membership: Premium</ThemedText>
          <ThemedText type="default">Joined: January 2023</ThemedText>
          <ThemedText type="caption">Last login: 5 minutes ago</ThemedText>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
  },
});

export default ProfileScreen;
