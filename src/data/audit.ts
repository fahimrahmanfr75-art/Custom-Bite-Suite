import { db } from './schema';
import type { SqlRunner } from './schema';
import type { Role, AuditLog } from '../types';

type AuditRow = {
  id: number;
  actor_user_id: number;
  actor_name: string;
  actor_role: Role;
  entity_type: string;
  entity_id: number;
  action: string;
  details: string;
  created_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function logAudit(
  runner: SqlRunner,
  actorUserId: number,
  entityType: string,
  entityId: number,
  action: string,
  details: string
) {
  await runner.runAsync(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    actorUserId,
    entityType,
    entityId,
    action,
    details,
    nowIso()
  );
}

export async function getAuditLogs() {
  const rows = await db.getAllAsync<AuditRow>(
    `SELECT
       a.id,
       a.actor_user_id,
       u.first_name || ' ' || u.last_name AS actor_name,
       u.role AS actor_role,
       a.entity_type,
       a.entity_id,
       a.action,
       a.details,
       a.created_at
     FROM audit_logs a
     JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC, a.id DESC`
  );

  return rows.map<AuditLog>((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    details: row.details,
    createdAt: row.created_at,
  }));
}
