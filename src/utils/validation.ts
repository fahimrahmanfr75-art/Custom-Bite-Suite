import { z } from 'zod';

import type { LoginPayload, RegisterPayload } from '../types';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = z
  .object({
    role: z.enum(['customer', 'manager', 'rider']),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only use letters, numbers, dot, dash, underscore'),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^[0-9+ -]+$/, 'Phone number format is invalid'),
    dateOfBirth: z.string().min(4, 'Date of birth is required'),
    password: passwordRule,
    confirmPassword: z.string(),
    addressLine: z.string().optional().default(''),
    notes: z.string().optional().default(''),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter email, username, or phone'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['customer', 'manager', 'rider']),
});

export function validateRegistration(payload: RegisterPayload) {
  return registerSchema.safeParse(payload);
}

export function validateLogin(payload: LoginPayload) {
  return loginSchema.safeParse(payload);
}
