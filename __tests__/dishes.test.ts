let mockDb: {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withExclusiveTransactionAsync: jest.Mock;
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    mockDb = {
      execAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async () => []),
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
      withExclusiveTransactionAsync: jest.fn(async (callback: (txn: unknown) => Promise<void>) => {
        await callback(mockDb);
      }),
    };

    return mockDb;
  }),
}));

import { getDishes, getIngredientCategories, upsertDishRecord } from '../src/data/dishes';

describe('dishes data module', () => {
  beforeEach(() => {
    mockDb.execAsync.mockClear();
    mockDb.getAllAsync.mockClear();
    mockDb.getFirstAsync.mockClear();
    mockDb.runAsync.mockClear();
    mockDb.withExclusiveTransactionAsync.mockClear();
  });

  it('loads dish ingredients with category and mandatory flags', async () => {
    mockDb.getAllAsync.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM dishes d')) {
        return [
          {
            id: 9,
            category_id: 2,
            category_name: 'Rice Bowls',
            name: 'Power Bowl',
            description: 'Balanced bowl.',
            price: 12.5,
            prep_time_minutes: 14,
            calories: 540,
            spice_level: 'Mild',
            is_available: 1,
            image_url: 'file://dish.jpg',
            average_rating: 4.5,
            review_count: 3,
          },
        ];
      }

      if (sql.includes('FROM dish_ingredients di')) {
        return [
          {
            dish_id: 9,
            ingredient_id: 71,
            ingredient_category_id: 5,
            ingredient_category_name: 'Foundation',
            ingredient_name: 'Basmati Rice',
            is_allergen: 0,
            is_mandatory: 1,
            is_default: 1,
            extra_price: 4,
            can_add: 0,
            can_remove: 0,
            sort_order: 0,
          },
          {
            dish_id: 9,
            ingredient_id: 72,
            ingredient_category_id: 6,
            ingredient_category_name: 'Extras',
            ingredient_name: 'Avocado',
            is_allergen: 0,
            is_mandatory: 0,
            is_default: 0,
            extra_price: 1.5,
            can_add: 1,
            can_remove: 0,
            sort_order: 1,
          },
        ];
      }

      if (sql.includes('FROM reviews r')) {
        return [];
      }

      return [];
    });

    const dishes = await getDishes();

    expect(dishes).toHaveLength(1);
    expect(dishes[0].ingredients).toEqual([
      expect.objectContaining({
        ingredientId: 71,
        ingredientCategoryId: 5,
        ingredientCategoryName: 'Foundation',
        isMandatory: true,
        canAdd: false,
        canRemove: false,
      }),
      expect.objectContaining({
        ingredientId: 72,
        ingredientCategoryId: 6,
        ingredientCategoryName: 'Extras',
        isMandatory: false,
        canAdd: true,
        canRemove: false,
      }),
    ]);
  });

  it('loads ingredient categories for the manager editor', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 1, dish_id: 9, name: 'Foundation', description: 'Base layer', sort_order: 0 },
      { id: 2, dish_id: 9, name: 'Extras', description: 'Optional add-ons', sort_order: 1 },
    ]);

    await expect(getIngredientCategories()).resolves.toEqual([
      { id: 1, dishId: 9, name: 'Foundation', description: 'Base layer', sortOrder: 0 },
      { id: 2, dishId: 9, name: 'Extras', description: 'Optional add-ons', sortOrder: 1 },
    ]);
  });

  it('persists ingredient categories and dish ingredients when saving a dish', async () => {
    const insertIds = [22, 301, 401];
    mockDb.runAsync.mockImplementation(async (sql: string) => {
      if (sql.startsWith('INSERT INTO dishes')) {
        return { changes: 1, lastInsertRowId: insertIds.shift() ?? 22 };
      }
      if (sql.startsWith('INSERT INTO ingredient_categories')) {
        return { changes: 1, lastInsertRowId: insertIds.shift() ?? 301 };
      }
      if (sql.startsWith('INSERT INTO ingredients')) {
        return { changes: 1, lastInsertRowId: insertIds.shift() ?? 401 };
      }
      return { changes: 1, lastInsertRowId: 1 };
    });
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await upsertDishRecord(2, {
      categoryId: 1,
      name: 'Atlas Burger',
      description: 'Smoked and stacked.',
      price: 13.25,
      prepTimeMinutes: 19,
      calories: 780,
      spiceLevel: 'Medium',
      isAvailable: true,
      imageUrl: 'file://atlas.jpg',
      ingredientCategories: [
        {
          name: 'Foundation',
          description: 'Core build',
          sortOrder: 0,
          ingredients: [
            {
              name: 'Smoked Patty',
              isMandatory: true,
              isDefault: true,
              extraPrice: 8.5,
              canAdd: false,
              canRemove: false,
              sortOrder: 0,
            },
          ],
        },
      ],
    });

    expect(mockDb.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.runAsync.mock.calls.some(([sql]) => sql.includes('INSERT INTO ingredient_categories'))).toBe(
      true
    );
    expect(mockDb.runAsync.mock.calls.some(([sql]) => sql.includes('INSERT INTO dish_ingredients'))).toBe(
      true
    );
    expect(mockDb.runAsync.mock.calls.some(([sql]) => sql.includes('INSERT INTO dishes'))).toBe(true);

    const dishIngredientInsert = mockDb.runAsync.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO dish_ingredients')
    );
    expect(dishIngredientInsert?.slice(1)).toEqual([22, 401, 301, 1, 1, 8.5, 0, 0, 0]);
  });
});
