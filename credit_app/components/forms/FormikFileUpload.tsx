import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useField } from 'formik';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

interface FormikFileUploadProps {
  name: string;
  label: string;
}

const FormikFileUpload: React.FC<FormikFileUploadProps> = ({ label, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const showError = meta.touched && meta.error;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync();
      if (!result.canceled) {
        helpers.setValue(result.assets[0]); // Store the first asset
      }
    } catch (err) {
      console.log("Document Picker Error: ", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.uploadButton, showError && styles.uploadButtonError]}
        onPress={pickDocument}
      >
        <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
        <Text style={styles.uploadButtonText}>
          {field.value ? field.value.name : 'Choose File'}
        </Text>
      </TouchableOpacity>
      {showError && <Text style={styles.errorText}>{meta.error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  uploadButtonError: {
    borderColor: 'red',
  },
  uploadButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikFileUpload;
