import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Button, Alert } from 'react-native';
import Card from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import FormikSelect from '@/components/forms/FormikSelect';
import FormikCheckbox from '@/components/forms/FormikCheckbox';
import { Formik } from 'formik';
import * as Yup from 'yup';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => console.log('Logged out') },
    ]);
  };

  const initialValues = {
    language: 'en',
    privacyConsent: false,
  };

  const validationSchema = Yup.object().shape({
    language: Yup.string().required('Language is required'),
    privacyConsent: Yup.boolean().oneOf([true], 'You must agree to the privacy policy'),
  });

  return (
    <ScrollView style={styles.scrollViewContent}>
      <View style={styles.container}>
        <ThemedText type="title">Settings Screen</ThemedText>

        <Card style={styles.card}>
          <ThemedText type="subtitle">General Settings</ThemedText>
          <View style={styles.settingItem}>
            <ThemedText type="default">Enable Notifications</ThemedText>
            <Switch
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <ThemedText type="default">Dark Mode</ThemedText>
            <Switch
              onValueChange={setDarkModeEnabled}
              value={darkModeEnabled}
            />
          </View>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => console.log('Settings Updated:', values)}
          >
            {({ handleSubmit }) => (
              <View>
                <FormikSelect
                  name="language"
                  label="App Language"
                  options={[
                    { label: 'English', value: 'en' },
                    { label: 'Spanish', value: 'es' },
                    { label: 'French', value: 'fr' },
                  ]}
                />
                <FormikCheckbox name="privacyConsent" label="Agree to Privacy Policy" />
                <Button title="Save Settings" onPress={handleSubmit} />
              </View>
            )}
          </Formik>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Account Actions</ThemedText>
          <Button title="Logout" onPress={handleLogout} color="red" />
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
});

export default SettingsScreen;
