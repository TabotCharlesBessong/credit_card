import React from 'react';
import { TextInput, StyleSheet, Text, View } from 'react-native';
import { useField } from 'formik';

interface FormikTextInputProps {
  name: string;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
}

const FormikTextInput: React.FC<FormikTextInputProps> = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  const showError = meta.touched && meta.error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, showError && styles.inputError]}
        onChangeText={field.onChange(props.name)}
        onBlur={field.onBlur(props.name)}
        value={field.value}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
        secureTextEntry={props.secureTextEntry}
      />
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikTextInput;
