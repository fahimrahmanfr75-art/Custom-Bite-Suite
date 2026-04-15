import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface CheckboxProps {
  value: boolean;
  onValueChange?: (newValue: boolean) => void;
  disabled?: boolean;
  color?: string;
}

export function Checkbox({ value, onValueChange, disabled = false, color = '#D45D31' }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled && onValueChange) {
          onValueChange(!value);
        }
      }}
      disabled={disabled}
      style={[styles.checkbox, value && { backgroundColor: color }, disabled && styles.disabled]}
    >
      {value && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  disabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#CCCCCC',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
