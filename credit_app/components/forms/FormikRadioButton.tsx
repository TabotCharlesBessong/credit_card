import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useField } from 'formik';

interface RadioOption {
  label: string;
  value: string;
}

interface FormikRadioButtonProps {
  name: string;
  label: string;
  options: RadioOption[];
}

const FormikRadioButton: React.FC<FormikRadioButtonProps> = ({ label, options, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const showError = meta.touched && meta.error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => helpers.setValue(option.value)}
          >
            <View style={[styles.radioCircle, field.value === option.value && styles.selectedRadioCircle]}>
              {field.value === option.value && <View style={styles.innerCircle} />}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRadioCircle: {
    borderColor: '#007AFF',
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikRadioButton;
