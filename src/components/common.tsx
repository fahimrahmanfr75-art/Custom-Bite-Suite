import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

export function ScreenCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : undefined]}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'ghost' && styles.ghostButton,
        variant === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.secondaryButtonText,
          variant === 'ghost' && styles.ghostButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  ...props
}: TextInputProps & { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#667782"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export const commonStyles = StyleSheet.create({
  mutedText: {
    color: '#56707B',
  },
  smallText: {
    color: '#56707B',
    fontSize: 12,
  },
  metricValue: {
    color: '#0F2529',
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#56707B',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F6EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D6D1C4',
    padding: 18,
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: '#0F2529',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#56707B',
    fontSize: 14,
  },
  pill: {
    backgroundColor: '#E7E3D9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: '#174C4F',
  },
  pillText: {
    color: '#174C4F',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FDF9EF',
  },
  button: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#D45D31',
  },
  secondaryButton: {
    backgroundColor: '#174C4F',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderColor: '#D6D1C4',
    borderWidth: 1,
  },
  dangerButton: {
    backgroundColor: '#9D3C2A',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF7ED',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#F8F4E8',
  },
  ghostButtonText: {
    color: '#174C4F',
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFCF4',
    borderColor: '#D6D1C4',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0F2529',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
