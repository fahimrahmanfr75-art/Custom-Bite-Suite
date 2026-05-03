let mockDefaultDb: {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withExclusiveTransactionAsync: jest.Mock;
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    mockDefaultDb = {
      execAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async () => []),
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
      withExclusiveTransactionAsync: jest.fn(async (callback: (txn: unknown) => Promise<void>) => {
        await callback(mockDefaultDb);
      }),
    };

    return mockDefaultDb;
  }),
}));

import { clearCart, getCart, replaceCart } from '../src/data/cart';
import type { CartItem } from '../src/types';

describe('cart persistence', () => {
  beforeEach(() => {
    mockDefaultDb.execAsync.mockClear();
    mockDefaultDb.getAllAsync.mockClear();
    mockDefaultDb.getFirstAsync.mockClear();
    mockDefaultDb.runAsync.mockClear();
    mockDefaultDb.withExclusiveTransactionAsync.mockClear();
  });

  it('round-trips cart items for the active user only', async () => {
    const cart: CartItem[] = [
      {
        id: 'line-1',
        dishId: 7,
        dishName: 'Fireline Chicken Burger',
        quantity: 2,
        basePrice: 8.9,
        instructions: 'Extra napkins',
        customizations: [{ ingredientId: 8, name: 'Jalapeno', action: 'add', priceDelta: 0.75 }],
      },
    ];

    await replaceCart({ userId: 9, role: 'customer' }, cart);

    expect(mockDefaultDb.runAsync).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM cart_items WHERE owner_key = ?',
      'user:9'
    );
    expect(mockDefaultDb.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO cart_items'),
      'line-1',
      'user:9',
      7,
      'Fireline Chicken Burger',
      2,
      8.9,
      'Extra napkins',
      JSON.stringify(cart[0].customizations),
      expect.any(String)
    );

    mockDefaultDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 'line-1',
        dish_id: 7,
        dish_name: 'Fireline Chicken Burger',
        quantity: 2,
        base_price: 8.9,
        instructions: 'Extra napkins',
        customizations_json: JSON.stringify(cart[0].customizations),
      },
    ]);

    await expect(getCart({ userId: 9, role: 'customer' })).resolves.toEqual(cart);
    expect(mockDefaultDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('FROM cart_items'), 'user:9');
  });

  it('clears guest cart separately from signed-in carts', async () => {
    await clearCart(null);

    expect(mockDefaultDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM cart_items WHERE owner_key = ?',
      'guest'
    );
  });
});
