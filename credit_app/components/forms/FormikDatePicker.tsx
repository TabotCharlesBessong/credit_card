import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { useField } from 'formik';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface FormikDatePickerProps {
  name: string;
  label: string;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'calendar' | 'compact';
}

const FormikDatePicker: React.FC<FormikDatePickerProps> = ({ label, mode = 'date', display = 'default', ...props }) => {
  const [field, meta, helpers] = useField(props);
  const [show, setShow] = useState(false);
  const showError = meta.touched && meta.error;

  const currentValue = field.value ? new Date(field.value) : new Date();

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || currentValue;
    setShow(Platform.OS === 'ios');
    helpers.setValue(currentDate.toISOString());
    helpers.setTouched(true);
  };

  const showMode = () => {
    setShow(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={showMode} style={[styles.input, showError && styles.inputError]}>
        <Text>{field.value ? format(currentValue, 'PPP') : 'Select a date'}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={currentValue}
          mode={mode}
          display={display}
          onChange={onChange}
        />
      )}
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
    justifyContent: 'center',
    minHeight: 40, // Ensure consistent height
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

export default FormikDatePicker;
