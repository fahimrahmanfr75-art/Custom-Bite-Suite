import { db } from './schema';
import type { AppNotification, NotificationAudience, NotificationKind, Role, Session } from '../types';

type NotificationRow = {
  id: number;
  audience: NotificationAudience;
  recipient_user_id: number | null;
  recipient_role: Role | null;
  order_id: number | null;
  kind: NotificationKind;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
};

type CreateNotificationInput = {
  audience: NotificationAudience;
  recipientUserId?: number | null;
  recipientRole?: Role | null;
  orderId?: number | null;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt?: string;
};

export async function getNotifications(session: Session): Promise<AppNotification[]> {
  const rows = await db.getAllAsync<NotificationRow>(
    `WITH notifications AS (
       SELECT * FROM app_notifications
     )
     SELECT * FROM notifications
     WHERE (recipient_user_id = ? AND audience = 'user')
        OR (recipient_role = ? AND audience = 'role')
     ORDER BY created_at DESC`,
    session.userId,
    session.role
  );

  return rows.map<AppNotification>((row) => ({
    id: row.id,
    audience: row.audience,
    recipientUserId: row.recipient_user_id,
    recipientRole: row.recipient_role,
    orderId: row.order_id,
    kind: row.kind,
    title: row.title,
    message: row.message,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  }));
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await db.runAsync(
    `UPDATE app_notifications SET is_read = 1 WHERE id = ?`,
    notificationId
  );
}

export async function createNotification(
  input: CreateNotificationInput,
  runner: Pick<typeof db, 'runAsync'> = db
): Promise<void> {
  await runner.runAsync(
    `INSERT INTO app_notifications
      (audience, recipient_user_id, recipient_role, order_id, kind, title, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    input.audience,
    input.recipientUserId ?? null,
    input.recipientRole ?? null,
    input.orderId ?? null,
    input.kind,
    input.title,
    input.message,
    input.createdAt ?? new Date().toISOString()
  );
}

export async function markAllNotificationsReadForSession(session: Session): Promise<void> {
  await db.runAsync(
    `UPDATE app_notifications 
     SET is_read = 1 
     WHERE (recipient_user_id = ? AND audience = 'user') 
        OR (recipient_role = ? AND audience = 'role')`,
    session.userId,
    session.role
  );
}
