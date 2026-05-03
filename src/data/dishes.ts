import { db } from './schema';
import { logAudit } from './audit';
import type {
  Category,
  Dish,
  DishIngredient,
  IngredientCategory,
  ManagerDishPayload,
  Offer,
  Review,
} from '../types';

type CategoryRow = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
};

type DishRow = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  prep_time_minutes: number;
  calories: number;
  spice_level: string;
  is_available: number;
  image_url: string;
  average_rating: number | null;
  review_count: number;
};

type DishIngredientRow = {
  dish_id: number;
  ingredient_id: number;
  ingredient_category_id: number | null;
  ingredient_category_name: string | null;
  ingredient_name: string;
  is_mandatory: number;
  is_default: number;
  extra_price: number;
  can_add: number;
  can_remove: number;
  sort_order: number;
};

type IngredientCategoryRow = {
  id: number;
  dish_id: number;
  name: string;
  description: string;
  sort_order: number;
};

type ReviewRow = {
  id: number;
  dish_id: number;
  customer_id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export async function getOffers() {
  return db.getAllAsync<Offer>(`SELECT * FROM offers ORDER BY id`);
}

export async function getCategories() {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories ORDER BY sort_order, id`
  );
  return rows.map<Category>((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function getIngredientCategories() {
  const rows = await db.getAllAsync<IngredientCategoryRow>(
    `SELECT id, dish_id, name, description, sort_order
     FROM ingredient_categories
     ORDER BY dish_id, sort_order, id`
  );

  return rows.map<IngredientCategory>((row) => ({
    id: row.id,
    dishId: row.dish_id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function getDishes() {
  const [dishRows, ingredientRows, reviewRows] = await Promise.all([
    db.getAllAsync<DishRow>(
      `SELECT
          d.id,
          d.category_id,
          c.name AS category_name,
          d.name,
          d.description,
          d.price,
          d.prep_time_minutes,
          d.calories,
          d.spice_level,
          d.is_available,
          d.image_url,
          AVG(r.rating) AS average_rating,
          COUNT(r.id) AS review_count
        FROM dishes d
        JOIN categories c ON c.id = d.category_id
        LEFT JOIN reviews r ON r.dish_id = d.id
        GROUP BY d.id
        ORDER BY c.sort_order, d.name`
    ),
    db.getAllAsync<DishIngredientRow>(
      `SELECT
         di.dish_id,
         di.ingredient_id,
         di.ingredient_category_id,
         ic.name AS ingredient_category_name,
         i.name AS ingredient_name,
         di.is_mandatory,
         di.is_default,
         di.extra_price,
         di.can_add,
         di.can_remove,
         di.sort_order
       FROM dish_ingredients di
       JOIN ingredients i ON i.id = di.ingredient_id
       LEFT JOIN ingredient_categories ic ON ic.id = di.ingredient_category_id
       ORDER BY di.dish_id, COALESCE(ic.sort_order, 0), di.sort_order, i.name`
    ),
    db.getAllAsync<ReviewRow>(
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
    ),
  ]);

  const ingredientMap = ingredientRows.reduce<Record<number, DishIngredient[]>>((acc, row) => {
    const current = acc[row.dish_id] ?? [];
    current.push({
      ingredientId: row.ingredient_id,
      ingredientCategoryId: row.ingredient_category_id ?? 0,
      ingredientCategoryName: row.ingredient_category_name ?? 'Included',
      name: row.ingredient_name,
      isDefault: !!row.is_default,
      isMandatory: !!row.is_mandatory,
      extraPrice: row.extra_price,
      canAdd: !!row.can_add,
      canRemove: !!row.can_remove,
    });
    acc[row.dish_id] = current;
    return acc;
  }, {});

  const reviewMap = reviewRows.reduce<Record<number, Review[]>>((acc, row) => {
    const current = acc[row.dish_id] ?? [];
    current.push({
      id: row.id,
      dishId: row.dish_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
    });
    acc[row.dish_id] = current;
    return acc;
  }, {});

  return dishRows.map<Dish>((row) => ({
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    name: row.name,
    description: row.description,
    price: row.price,
    prepTimeMinutes: row.prep_time_minutes,
    calories: row.calories,
    spiceLevel: row.spice_level,
    isAvailable: !!row.is_available,
    imageUrl: row.image_url,
    ingredients: ingredientMap[row.id] ?? [],
    reviews: reviewMap[row.id] ?? [],
    averageRating: Number((row.average_rating ?? 0).toFixed(1)),
    reviewCount: row.review_count,
  }));
}

export async function upsertDishRecord(actorUserId: number, payload: ManagerDishPayload) {
  const trimmedName = payload.name.trim();
  const trimmedDescription = payload.description.trim();
  const trimmedSpiceLevel = payload.spiceLevel.trim();
  const normalizedCategories = payload.ingredientCategories
    .map((category, categoryIndex) => ({
      ...category,
      name: category.name.trim(),
      description: category.description.trim(),
      sortOrder: category.sortOrder ?? categoryIndex,
      ingredients: category.ingredients
        .map((ingredient, ingredientIndex) => ({
          ...ingredient,
          name: ingredient.name.trim(),
          extraPrice: Number(ingredient.extraPrice) || 0,
          sortOrder: ingredient.sortOrder ?? ingredientIndex,
        }))
        .filter((ingredient) => ingredient.name.length > 0),
    }))
    .filter((category) => category.name.length > 0 && category.ingredients.length > 0);

  await db.withExclusiveTransactionAsync(async (txn) => {
    let dishId = payload.id ?? 0;

    if (payload.id) {
      await txn.runAsync(
        `UPDATE dishes
         SET category_id = ?, name = ?, description = ?, price = ?, prep_time_minutes = ?, calories = ?, spice_level = ?, is_available = ?, image_url = ?
         WHERE id = ?`,
        payload.categoryId,
        trimmedName,
        trimmedDescription,
        payload.price,
        payload.prepTimeMinutes,
        payload.calories,
        trimmedSpiceLevel,
        payload.isAvailable ? 1 : 0,
        payload.imageUrl.trim(),
        payload.id
      );
      await txn.runAsync(`DELETE FROM dish_ingredients WHERE dish_id = ?`, payload.id);
      await txn.runAsync(`DELETE FROM ingredient_categories WHERE dish_id = ?`, payload.id);
    } else {
      const result = await txn.runAsync(
        `INSERT INTO dishes
          (category_id, name, description, price, prep_time_minutes, calories, spice_level, is_available, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        payload.categoryId,
        trimmedName,
        trimmedDescription,
        payload.price,
        payload.prepTimeMinutes,
        payload.calories,
        trimmedSpiceLevel,
        payload.isAvailable ? 1 : 0,
        payload.imageUrl.trim(),
        new Date().toISOString()
      );
      dishId = Number(result.lastInsertRowId);
    }

    for (const category of normalizedCategories) {
      const categoryResult = await txn.runAsync(
        `INSERT INTO ingredient_categories (dish_id, name, description, sort_order)
         VALUES (?, ?, ?, ?)`,
        dishId,
        category.name,
        category.description,
        category.sortOrder
      );
      const ingredientCategoryId = Number(categoryResult.lastInsertRowId);

      for (const ingredient of category.ingredients) {
        const existingIngredient = await txn.getFirstAsync<{ id: number }>(
          `SELECT id FROM ingredients WHERE lower(name) = lower(?)`,
          ingredient.name
        );
        const ingredientId =
          existingIngredient?.id ??
          Number(
            (
              await txn.runAsync(
                `INSERT INTO ingredients (name, is_allergen) VALUES (?, 0)`,
                ingredient.name
              )
            ).lastInsertRowId
          );

        await txn.runAsync(
          `INSERT INTO dish_ingredients
            (dish_id, ingredient_id, ingredient_category_id, is_mandatory, is_default, extra_price, can_add, can_remove, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          dishId,
          ingredientId,
          ingredientCategoryId,
          ingredient.isMandatory ? 1 : 0,
          ingredient.isMandatory || ingredient.isDefault ? 1 : 0,
          ingredient.extraPrice,
          ingredient.isMandatory ? 0 : ingredient.canAdd ? 1 : 0,
          ingredient.isMandatory ? 0 : ingredient.canRemove ? 1 : 0,
          ingredient.sortOrder
        );
      }
    }

    await logAudit(
      txn,
      actorUserId,
      'dish',
      dishId,
      payload.id ? 'update' : 'create',
      trimmedName
    );
  });
}

export async function deleteDishRecord(actorUserId: number, dishId: number) {
  await db.runAsync(`DELETE FROM dishes WHERE id = ?`, dishId);
  await logAudit(db, actorUserId, 'dish', dishId, 'delete', 'Dish removed from menu');
}
