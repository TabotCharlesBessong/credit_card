import React, { useState } from 'react';
import { TextInput, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useField } from 'formik';
import { Ionicons } from '@expo/vector-icons'; // Assuming you have expo vector icons installed

interface FormikPasswordInputProps {
  name: string;
  label: string;
  placeholder?: string;
}

const FormikPasswordInput: React.FC<FormikPasswordInputProps> = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const showError = meta.touched && meta.error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, showError && styles.inputContainerError]}>
        <TextInput
          style={styles.input}
          onChangeText={field.onChange(props.name)}
          onBlur={field.onBlur(props.name)}
          value={field.value}
          placeholder={props.placeholder}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  inputContainerError: {
    borderColor: 'red',
  },
  toggleButton: {
    padding: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikPasswordInput;
