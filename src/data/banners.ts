import { db } from './schema';
import { logAudit } from './audit';
import type { BannerImage, BannerPayload } from '../types';

export async function getBannerImages(): Promise<BannerImage[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM banner_images ORDER BY sort_order, id`
  );

  return rows.map<BannerImage>((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    description: row.description,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

export async function upsertBannerImage(actorUserId: number, payload: BannerPayload): Promise<void> {
  if (payload.id) {
    await db.runAsync(
      `UPDATE banner_images 
       SET image_url = ?, title = ?, description = ?, is_active = ?, sort_order = ?
       WHERE id = ?`,
      payload.imageUrl,
      payload.title,
      payload.description,
      payload.isActive ? 1 : 0,
      payload.sortOrder,
      payload.id
    );
    await logAudit(db, actorUserId, 'banner', payload.id, 'update', payload.title);
  } else {
    const result = await db.runAsync(
      `INSERT INTO banner_images (image_url, title, description, is_active, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      payload.imageUrl,
      payload.title,
      payload.description,
      payload.isActive ? 1 : 0,
      payload.sortOrder,
      new Date().toISOString()
    );
    await logAudit(
      db,
      actorUserId,
      'banner',
      Number(result.lastInsertRowId),
      'create',
      payload.title
    );
  }
}

export async function removeBannerImage(actorUserId: number, bannerId: number): Promise<void> {
  await db.runAsync(`DELETE FROM banner_images WHERE id = ?`, bannerId);
  await logAudit(db, actorUserId, 'banner', bannerId, 'delete', 'Banner removed');
}