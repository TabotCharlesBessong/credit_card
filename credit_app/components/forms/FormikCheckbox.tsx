import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useField } from 'formik';
import { Ionicons } from '@expo/vector-icons'; // Assuming you have expo vector icons installed

interface FormikCheckboxProps {
  name: string;
  label: string;
}

const FormikCheckbox: React.FC<FormikCheckboxProps> = ({ label, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const showError = meta.touched && meta.error;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => helpers.setValue(!field.value)}
      >
        <View style={[styles.checkbox, field.value && styles.checkedCheckbox]}>
          {field.value && <Ionicons name="checkmark" size={18} color="white" />}
        </View>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
      {showError && <Text style={styles.errorText}>{meta.error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  label: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikCheckbox;
