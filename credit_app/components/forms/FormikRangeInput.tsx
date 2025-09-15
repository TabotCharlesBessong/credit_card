import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useField } from 'formik';

interface FormikRangeInputProps {
  name: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}

const FormikRangeInput: React.FC<FormikRangeInputProps> = ({ label, min = 0, max = 100, step = 1, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const showError = meta.touched && meta.error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}: {field.value}</Text>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={Number(field.value)}
        onValueChange={(value) => helpers.setValue(value)}
        onSlidingComplete={() => helpers.setTouched(true)}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#007AFF"
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
  slider: {
    width: '100%',
    height: 40,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikRangeInput;
