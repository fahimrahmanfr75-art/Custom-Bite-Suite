import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';

import { AppButton, Field, Pill, ScreenCard } from '../components/common';
import { useAppActions, useAppStatus } from '../context/AppContext';
import type { Role } from '../types';

const roleOptions: Role[] = ['customer', 'manager', 'rider'];

export function AuthScreen() {
  const { login, register } = useAppActions();
  const { errorMessage, isBusy } = useAppStatus();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('customer');

  // Login fields
  const [identifier, setIdentifier] = useState('sara');
  const [password, setPassword] = useState('Customer123');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field errors for register
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [registerPasswordError, setRegisterPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const helperCopy = useMemo(
    () => ({
      customer: 'Customer demo: sara / Customer123',
      manager: 'Manager demo: manager / Manager123',
      rider: 'Rider demo: rider1 / Rider123',
    }),
    []
  );

  function validateLoginForm(): boolean {
    let valid = true;
    setIdentifierError('');
    setPasswordError('');

    if (!identifier.trim()) {
      setIdentifierError('Email, username, or phone is required');
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    }

    return valid;
  }

  function validateRegisterForm(): boolean {
    let valid = true;
    setFirstNameError('');
    setLastNameError('');
    setUsernameError('');
    setEmailError('');
    setPhoneError('');
    setDobError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      valid = false;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      valid = false;
    }
    if (!username.trim()) {
      setUsernameError('Username is required');
      valid = false;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }
    if (!phone.trim()) {
      setPhoneError('Phone is required');
      valid = false;
    }
    if (!dateOfBirth.trim()) {
      setDobError('Date of birth is required');
      valid = false;
    }
    if (!password.trim()) {
      setRegisterPasswordError('Password is required');
      valid = false;
    } else if (password.length < 8) {
      setRegisterPasswordError('Password must be at least 8 characters');
      valid = false;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Confirm password is required');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    return valid;
  }

  async function handleSubmit() {
    if (mode === 'login') {
      if (!validateLoginForm()) return;

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

    if (!validateRegisterForm()) return;

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
      addressLine: '123 Main Street',
      notes: '',
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Custom-Bite Suite</Text>
          <Text style={styles.title}>Single-vendor food delivery control surface</Text>
          {/* <Text style={styles.subtitle}>
            Customer ordering, kitchen command, rider logistics, COD reconciliation, and refund
            workflow in one Android-ready app.
          </Text> */}
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
          {errorMessage ? <Text style={styles.globalErrorText}>{errorMessage}</Text> : null}

          {mode === 'login' ? (
            <View style={styles.form}>
              <Field
                label="Email / Username / Phone"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setIdentifierError('');
                }}
                error={identifierError}
                autoCapitalize="none"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Field
                label="First name"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setFirstNameError('');
                }}
                error={firstNameError}
              />
              <Field
                label="Last name"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setLastNameError('');
                }}
                error={lastNameError}
              />
              <Field
                label="Username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setUsernameError('');
                }}
                error={usernameError}
                autoCapitalize="none"
              />
              <Field
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                error={emailError}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                label="Phone"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setPhoneError('');
                }}
                error={phoneError}
                keyboardType="phone-pad"
              />
              <Field
                label="Date of birth (YYYY-MM-DD)"
                value={dateOfBirth}
                onChangeText={(text) => {
                  setDateOfBirth(text);
                  setDobError('');
                }}
                error={dobError}
              />
              <Field
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setRegisterPasswordError('');
                }}
                error={registerPasswordError}
                secureTextEntry
                autoCapitalize="none"
              />
              <Field
                label="Confirm password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setConfirmPasswordError('');
                }}
                error={confirmPasswordError}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.centeredButtonRow}>
            <View style={styles.authButtonWrap}>
              <AppButton
                label={isBusy ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
                onPress={() => {
                  void handleSubmit();
                }}
                disabled={isBusy}
              />
            </View>
          </View>

          {mode === 'login' ? (
            <View style={styles.switchMode}>
              <Text style={styles.switchModeText}>Don't have an account? </Text>
              <Pressable onPress={() => setMode('register')}>
                <Text style={styles.switchModeLink}>Register</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.switchMode}>
              <Text style={styles.switchModeText}>Already have an account? </Text>
              <Pressable onPress={() => setMode('login')}>
                <Text style={styles.switchModeLink}>Login</Text>
              </Pressable>
            </View>
          )}
        </ScreenCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1E21',
  },
  scrollContent: {
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
    marginBottom: 0,
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
  globalErrorText: {
    color: '#9D3C2A',
    fontWeight: '700',
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  switchModeText: {
    color: '#56707B',
    fontSize: 13,
  },
  switchModeLink: {
    color: '#D45D31',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  centeredButtonRow: {
    alignItems: 'center',
  },
  authButtonWrap: {
    alignSelf: 'center',
  },
});
