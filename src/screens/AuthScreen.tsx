import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton, Field, Pill, ScreenCard } from '../components/common';
import { useApp } from '../context/AppContext';
import type { Role } from '../types';

const roleOptions: Role[] = ['customer', 'manager', 'rider'];

export function AuthScreen() {
  const { login, register, errorMessage, isBusy } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('customer');
  const [identifier, setIdentifier] = useState('sara');
  const [password, setPassword] = useState('Customer123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [notes, setNotes] = useState('');

  const helperCopy = useMemo(
    () => ({
      customer: 'Customer demo: sara / Customer123',
      manager: 'Manager demo: manager / Manager123',
      rider: 'Rider demo: rider1 / Rider123',
    }),
    []
  );

  async function handleSubmit() {
    if (mode === 'login') {
      const defaults = {
        customer: ['sara', 'Customer123'],
        manager: ['manager', 'Manager123'],
        rider: ['rider1', 'Rider123'],
      } as const;

      await login({
        identifier: identifier || defaults[role][0],
        password: password || defaults[role][1],
        role,
      });
      return;
    }

    await register({
      role,
      firstName,
      lastName,
      username,
      email,
      phone,
      dateOfBirth,
      password,
      confirmPassword,
      addressLine,
      notes,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Custom-Bite Suite</Text>
        <Text style={styles.title}>Single-vendor food delivery control surface</Text>
        <Text style={styles.subtitle}>
          Customer ordering, kitchen command, rider logistics, COD reconciliation, and refund
          workflow in one Android-ready app.
        </Text>
      </View>

      <ScreenCard style={styles.card}>
        <View style={styles.toggleRow}>
          <Pill label="Login" active={mode === 'login'} onPress={() => setMode('login')} />
          <Pill
            label="Register"
            active={mode === 'register'}
            onPress={() => setMode('register')}
          />
        </View>

        <View style={styles.toggleRow}>
          {roleOptions.map((option) => (
            <Pill
              key={option}
              label={option}
              active={role === option}
              onPress={() => {
                setRole(option);
                if (mode === 'login') {
                  setIdentifier(option === 'customer' ? 'sara' : option === 'manager' ? 'manager' : 'rider1');
                  setPassword(option === 'customer' ? 'Customer123' : option === 'manager' ? 'Manager123' : 'Rider123');
                }
              }}
            />
          ))}
        </View>

        <Text style={styles.demoText}>{helperCopy[role]}</Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {mode === 'login' ? (
          <View style={styles.form}>
            <Field
              label="Email / Username / Phone"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Field label="First name" value={firstName} onChangeText={setFirstName} />
            <Field label="Last name" value={lastName} onChangeText={setLastName} />
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field
              label="Date of birth (YYYY-MM-DD)"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
            />
            <Field
              label="Address"
              value={addressLine}
              onChangeText={setAddressLine}
              multiline
            />
            <Field label="Delivery notes" value={notes} onChangeText={setNotes} multiline />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Field
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        )}

        <AppButton
          label={isBusy ? 'Processing...' : mode === 'login' ? 'Enter App' : 'Create Account'}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isBusy}
        />
      </ScreenCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1E21',
    flexGrow: 1,
    gap: 18,
    padding: 18,
    paddingTop: 64,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: '#E7B56A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F6F1E5',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  subtitle: {
    color: '#A4BDC0',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  form: {
    gap: 12,
  },
  demoText: {
    color: '#56707B',
    fontSize: 13,
  },
  errorText: {
    color: '#9D3C2A',
    fontWeight: '700',
  },
});
