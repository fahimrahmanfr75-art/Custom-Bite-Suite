import { calculateDishPrice, calculateSelectedIngredients } from '../src/utils/dishPricing';
import type { Dish, OrderItemCustomization } from '../src/types';

const dish: Pick<Dish, 'ingredients'> = {
  ingredients: [
    {
      ingredientId: 1,
      ingredientCategoryId: 1,
      ingredientCategoryName: 'Foundation',
      name: 'Hand-cut Tenderloin',
      isDefault: true,
      isMandatory: true,
      extraPrice: 12,
      canAdd: false,
      canRemove: false,
    },
    {
      ingredientId: 2,
      ingredientCategoryId: 1,
      ingredientCategoryName: 'Foundation',
      name: 'Confit Egg Yolk',
      isDefault: true,
      isMandatory: false,
      extraPrice: 3,
      canAdd: true,
      canRemove: true,
    },
    {
      ingredientId: 3,
      ingredientCategoryId: 2,
      ingredientCategoryName: 'Seasoning',
      name: 'Shallot Brunoise',
      isDefault: true,
      isMandatory: false,
      extraPrice: 2,
      canAdd: true,
      canRemove: true,
    },
    {
      ingredientId: 4,
      ingredientCategoryId: 3,
      ingredientCategoryName: 'Accompaniments',
      name: 'Black Truffle',
      isDefault: false,
      isMandatory: false,
      extraPrice: 8,
      canAdd: true,
      canRemove: false,
    },
  ],
};

describe('dish pricing', () => {
  it('uses the sum of default-selected ingredient prices as the base dish price', () => {
    expect(calculateDishPrice(dish)).toBe(17);
    expect(calculateSelectedIngredients(dish).map((ingredient) => ingredient.name)).toEqual([
      'Hand-cut Tenderloin',
      'Confit Egg Yolk',
      'Shallot Brunoise',
    ]);
  });

  it('subtracts deselected default ingredients and adds selected optional ingredients', () => {
    const customizations: OrderItemCustomization[] = [
      {
        ingredientId: 3,
        name: 'Shallot Brunoise',
        action: 'remove',
        priceDelta: -2,
      },
      {
        ingredientId: 4,
        name: 'Black Truffle',
        action: 'add',
        priceDelta: 8,
      },
    ];

    expect(calculateDishPrice(dish, customizations)).toBe(23);
    expect(calculateSelectedIngredients(dish, customizations).map((ingredient) => ingredient.name)).toEqual([
      'Hand-cut Tenderloin',
      'Confit Egg Yolk',
      'Black Truffle',
    ]);
  });
});
