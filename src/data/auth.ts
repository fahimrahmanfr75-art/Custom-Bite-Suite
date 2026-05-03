import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { db } from './schema';
import { logAudit } from './audit';
import type { LoginPayload, RegisterPayload, Role, Session, User } from '../types';
import { validateLogin, validateRegistration } from '../utils/validation';

type UserRow = {
  id: number;
  role: Role;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  date_of_birth: string;
  password_hash: string;
  address_line: string;
  latitude: number;
  longitude: number;
  notes: string;
  created_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

const SESSION_STORAGE_KEY = 'custom_bite_session';

async function hashPassword(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function writeSession(session: Session | null) {
  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function getUsers() {
  const rows = await db.getAllAsync<UserRow>(`SELECT * FROM users ORDER BY id`);
  return rows.map<User>((row) => ({
    id: row.id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    passwordHash: row.password_hash,
    addressLine: row.address_line,
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

export async function getSession() {
  const row = await db.getFirstAsync<{ user_id: number | null; role: Role | null }>(
    `SELECT user_id, role FROM app_session WHERE id = 1`
  );
  if (row?.user_id && row.role) {
    return { userId: row.user_id, role: row.role } satisfies Session;
  }

  const storedSession = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession) as Partial<Session>;
    if (typeof parsed.userId === 'number' && (parsed.role === 'customer' || parsed.role === 'manager' || parsed.role === 'rider')) {
      return { userId: parsed.userId, role: parsed.role };
    }
  } catch {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
  }

  return null;
}

export async function login(payload: LoginPayload) {
  const validated = validateLogin(payload);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Invalid login details');
  }

  const user = await db.getFirstAsync<UserRow>(
    `SELECT * FROM users
     WHERE role = ?
       AND (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) OR phone = ?)
     LIMIT 1`,
    payload.role,
    payload.identifier,
    payload.identifier,
    payload.identifier
  );

  if (!user) {
    throw new Error('No user matched that role and identity');
  }

  const passwordHash = await hashPassword(payload.password);
  if (passwordHash !== user.password_hash) {
    throw new Error('Password is incorrect');
  }

  await db.runAsync(
    `INSERT INTO app_session (id, user_id, role, last_login_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, role = excluded.role, last_login_at = excluded.last_login_at`,
    user.id,
    user.role,
    nowIso()
  );
  await writeSession({ userId: user.id, role: user.role });

  await logAudit(db, user.id, 'session', user.id, 'login', `${user.role} logged in`);
}

export async function logout() {
  const session = await getSession();
  if (session) {
    await logAudit(db, session.userId, 'session', session.userId, 'logout', 'User logged out');
  }
  await db.runAsync(`DELETE FROM app_session WHERE id = 1`);
  await writeSession(null);
}

export async function register(payload: RegisterPayload) {
  const validated = validateRegistration(payload);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Registration failed validation');
  }

  const duplicate = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM users
     WHERE LOWER(email) = LOWER(?)
        OR LOWER(username) = LOWER(?)
        OR phone = ?
     LIMIT 1`,
    payload.email,
    payload.username,
    payload.phone
  );

  if (duplicate) {
    throw new Error('Email, username, or phone already exists');
  }

  const passwordHash = await hashPassword(payload.password);
  const createdAt = nowIso();
  const result = await db.runAsync(
    `INSERT INTO users
      (role, first_name, last_name, username, email, phone, date_of_birth, password_hash, address_line, latitude, longitude, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 23.7806, 90.4070, ?, ?)`,
    payload.role,
    payload.firstName.trim(),
    payload.lastName.trim(),
    payload.username.trim(),
    payload.email.trim(),
    payload.phone.trim(),
    payload.dateOfBirth,
    passwordHash,
    payload.addressLine.trim(),
    payload.notes.trim(),
    createdAt
  );

  await db.runAsync(
    `INSERT INTO app_session (id, user_id, role, last_login_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, role = excluded.role, last_login_at = excluded.last_login_at`,
    result.lastInsertRowId,
    payload.role,
    createdAt
  );
  await writeSession({ userId: Number(result.lastInsertRowId), role: payload.role });

  await logAudit(
    db,
    Number(result.lastInsertRowId),
    'user',
    Number(result.lastInsertRowId),
    'register',
    `${payload.role} registered`
  );
}
