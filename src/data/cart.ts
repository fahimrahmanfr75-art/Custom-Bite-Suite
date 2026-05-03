import { db } from './schema';
import type { CartItem, OrderItemCustomization, Session } from '../types';

type CartRow = {
  id: string;
  dish_id: number;
  dish_name: string;
  quantity: number;
  base_price: number;
  instructions: string;
  customizations_json: string;
};

function getCartOwnerKey(session: Session | null) {
  return session ? `user:${session.userId}` : 'guest';
}

function parseCustomizations(value: string): OrderItemCustomization[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as OrderItemCustomization[]) : [];
  } catch {
    return [];
  }
}

export async function getCart(session: Session | null): Promise<CartItem[]> {
  const rows = await db.getAllAsync<CartRow>(
    `SELECT id, dish_id, dish_name, quantity, base_price, instructions, customizations_json
     FROM cart_items
     WHERE owner_key = ?
     ORDER BY created_at ASC`,
    getCartOwnerKey(session)
  );

  return rows.map((row) => ({
    id: row.id,
    dishId: row.dish_id,
    dishName: row.dish_name,
    quantity: row.quantity,
    basePrice: row.base_price,
    instructions: row.instructions,
    customizations: parseCustomizations(row.customizations_json),
  }));
}

export async function replaceCart(session: Session | null, cartItems: CartItem[]): Promise<void> {
  const ownerKey = getCartOwnerKey(session);

  await db.runAsync('DELETE FROM cart_items WHERE owner_key = ?', ownerKey);

  for (const item of cartItems) {
    await db.runAsync(
      `INSERT INTO cart_items (
        id,
        owner_key,
        dish_id,
        dish_name,
        quantity,
        base_price,
        instructions,
        customizations_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      ownerKey,
      item.dishId,
      item.dishName,
      item.quantity,
      item.basePrice,
      item.instructions,
      JSON.stringify(item.customizations),
      new Date().toISOString()
    );
  }
}

export async function clearCart(session: Session | null): Promise<void> {
  await db.runAsync('DELETE FROM cart_items WHERE owner_key = ?', getCartOwnerKey(session));
}
