import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useField } from 'formik';
import { Picker as OriginalPicker, PickerProps, PickerItemProps } from '@react-native-picker/picker';

// Explicitly define the type for Picker to include its static 'Item' property
const Picker: React.FC<PickerProps<any>> & { Item: React.ComponentType<PickerItemProps> } = OriginalPicker as any;

interface SelectOption {
  label: string;
  value: string;
}

interface FormikSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
}

const FormikSelect: React.FC<FormikSelectProps> = ({ label, options, ...props }) => {
  const [field, meta] = useField(props);
  const showError = meta.touched && meta.error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerContainer, showError && styles.pickerContainerError]}>
        <Picker
          selectedValue={field.value}
          onValueChange={field.onChange(props.name)}
          onBlur={field.onBlur(props.name)}
          style={styles.picker}
        >
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerContainerError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FormikSelect;
