import type { Dish, DishIngredient, OrderItemCustomization } from '../types';

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function isIngredientSelected(
  ingredient: Pick<DishIngredient, 'ingredientId' | 'isDefault' | 'isMandatory'>,
  customizations: OrderItemCustomization[]
) {
  if (ingredient.isMandatory) {
    return true;
  }

  if (ingredient.isDefault) {
    return !customizations.some(
      (item) => item.ingredientId === ingredient.ingredientId && item.action === 'remove'
    );
  }

  return customizations.some(
    (item) => item.ingredientId === ingredient.ingredientId && item.action === 'add'
  );
}

export function calculateDishPrice(
  dish: Pick<Dish, 'ingredients'>,
  customizations: OrderItemCustomization[] = []
) {
  return roundCurrency(
    (dish.ingredients ?? [])
      .filter((ingredient) => isIngredientSelected(ingredient, customizations))
      .reduce((sum, ingredient) => sum + ingredient.extraPrice, 0)
  );
}

export function calculateSelectedIngredients(
  dish: Pick<Dish, 'ingredients'>,
  customizations: OrderItemCustomization[] = []
) {
  return (dish.ingredients ?? []).filter((ingredient) =>
    isIngredientSelected(ingredient, customizations)
  );
}
