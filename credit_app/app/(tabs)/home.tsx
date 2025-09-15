import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import FormikTextInput from '@/components/forms/FormikTextInput';
import FormikPasswordInput from '@/components/forms/FormikPasswordInput';
import FormikRadioButton from '@/components/forms/FormikRadioButton';
import FormikSelect from '@/components/forms/FormikSelect';
import FormikCheckbox from '@/components/forms/FormikCheckbox';
import FormikDatePicker from '@/components/forms/FormikDatePicker';
import FormikFileUpload from '@/components/forms/FormikFileUpload';
import FormikRangeInput from '@/components/forms/FormikRangeInput';
import Card from '@/components/ui/Card';
import AppLineChart from '@/components/charts/LineChart';
import AppBarChart from '@/components/charts/BarChart';
import { ThemedText } from '@/components/themed-text';
import { Formik } from 'formik';
import * as Yup from 'yup';

const HomeScreen = () => {
  const initialValues = {
    name: '',
    password: '',
    gender: '',
    country: '',
    rememberMe: false,
    birthDate: new Date().toISOString(),
    profilePicture: null,
    ageRange: 0,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    gender: Yup.string().required('Gender is required'),
    country: Yup.string().required('Country is required'),
    rememberMe: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
    birthDate: Yup.string().required('Birth date is required'),
    profilePicture: Yup.object().nullable().required('Profile picture is required'),
    ageRange: Yup.number().min(18, 'Must be at least 18').max(60, 'Must be at most 60').required('Age range is required'),
  });

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
      },
    ],
  };

  return (
    <ScrollView style={styles.scrollViewContent}>
      <View style={styles.container}>
        <ThemedText type="title">Home Screen - Component Showcase</ThemedText>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Formik Components</ThemedText>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => console.log(values)}
          >
            {({ handleSubmit }) => (
              <View>
                <FormikTextInput name="name" label="Name" placeholder="Enter your name" />
                <FormikPasswordInput name="password" label="Password" placeholder="Enter your password" />
                <FormikRadioButton
                  name="gender"
                  label="Gender"
                  options={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                  ]}
                />
                <FormikSelect
                  name="country"
                  label="Country"
                  options={[
                    { label: 'USA', value: 'usa' },
                    { label: 'Canada', value: 'canada' },
                    { label: 'Mexico', value: 'mexico' },
                  ]}
                />
                <FormikCheckbox name="rememberMe" label="Remember Me" />
                <FormikDatePicker name="birthDate" label="Birth Date" />
                <FormikFileUpload name="profilePicture" label="Profile Picture" />
                <FormikRangeInput name="ageRange" label="Age Range" min={18} max={60} step={1} />
                <Button title="Submit Form" onPress={handleSubmit} />
              </View>
            )}
          </Formik>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Charts</ThemedText>
          <AppLineChart data={chartData} title="Sample Line Chart" />
          <AppBarChart data={chartData} title="Sample Bar Chart" />
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">ThemedText Examples</ThemedText>
          <ThemedText type="default">Default Text</ThemedText>
          <ThemedText type="defaultSemiBold">Default SemiBold Text</ThemedText>
          <ThemedText type="subtitle">Subtitle Text</ThemedText>
          <ThemedText type="caption">Caption Text</ThemedText>
          <ThemedText type="link">Link Text</ThemedText>
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

export default HomeScreen;
