import { db } from './schema';
import { logAudit } from './audit';
import type { Review, SubmitReviewPayload } from '../types';

type ReviewRow = {
  id: number;
  dish_id: number;
  customer_id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export async function getReviews() {
  const rows = await db.getAllAsync<ReviewRow>(
    `SELECT
       r.id,
       r.dish_id,
       r.customer_id,
       u.first_name || ' ' || u.last_name AS customer_name,
       r.rating,
       r.comment,
       r.created_at
     FROM reviews r
     JOIN users u ON u.id = r.customer_id
     ORDER BY r.created_at DESC`
  );

  return rows.map<Review>((row) => ({
    id: row.id,
    dishId: row.dish_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}

export async function submitReview(customerId: number, payload: SubmitReviewPayload) {
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM reviews WHERE dish_id = ? AND customer_id = ?`,
    payload.dishId,
    customerId
  );
  if (existing) {
    await db.runAsync(
      `UPDATE reviews SET rating = ?, comment = ?, created_at = ? WHERE id = ?`,
      payload.rating,
      payload.comment.trim(),
      new Date().toISOString(),
      existing.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO reviews (dish_id, customer_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      payload.dishId,
      customerId,
      payload.rating,
      payload.comment.trim(),
      new Date().toISOString()
    );
  }

  await logAudit(db, customerId, 'review', payload.dishId, 'upsert', `Dish ${payload.dishId} rated ${payload.rating}`);
}