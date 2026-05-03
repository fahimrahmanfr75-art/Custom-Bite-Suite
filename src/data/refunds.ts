import { db } from './schema';
import { logAudit } from './audit';
import type { RefundRequest, SubmitRefundPayload } from '../types';

export async function getRefunds() {
  const rows = await db.getAllAsync<RefundRow>(`SELECT * FROM refund_requests ORDER BY created_at DESC`);
  return rows.map<RefundRequest>((row) => ({
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
  }));
}

export async function submitRefund(customerId: number, payload: SubmitRefundPayload) {
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM refund_requests WHERE order_id = ?`,
    payload.orderId
  );
  if (existing) {
    throw new Error('Refund request already exists for this order');
  }

  await db.runAsync(
    `INSERT INTO refund_requests (order_id, customer_id, reason, details, status, resolution_note, created_at)
     VALUES (?, ?, ?, ?, 'requested', '', ?)`,
    payload.orderId,
    customerId,
    payload.reason.trim(),
    payload.details.trim(),
    new Date().toISOString()
  );

  await logAudit(db, customerId, 'refund_request', payload.orderId, 'create', payload.reason.trim());
}

export async function updateRefundDecision(
  actorUserId: number,
  refundId: number,
  status: 'approved' | 'denied',
  resolutionNote: string
) {
  await db.runAsync(
    `UPDATE refund_requests
     SET status = ?, resolution_note = ?, reviewed_at = ?, reviewed_by = ?
     WHERE id = ?`,
    status,
    resolutionNote.trim(),
    new Date().toISOString(),
    actorUserId,
    refundId
  );

  await logAudit(db, actorUserId, 'refund_request', refundId, status, resolutionNote.trim());
}

type RefundRow = {
  id: number;
  order_id: number;
  customer_id: number;
  reason: string;
  details: string;
  status: RefundRequest['status'];
  resolution_note: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
};