import { CURATED_MENU_CATEGORIES, CURATED_MENU_DISHES } from '../src/data/curatedMenu';

describe('curated restaurant menu', () => {
  it('assigns every dish to a declared category', () => {
    const categoryNames = new Set(CURATED_MENU_CATEGORIES.map((category) => category.name));

    for (const dish of CURATED_MENU_DISHES) {
      expect(categoryNames.has(dish.categoryName)).toBe(true);
    }
  });

  it('ensures each dish has mandatory, default-selected, and optional extra ingredients', () => {
    for (const dish of CURATED_MENU_DISHES) {
      const ingredients = dish.ingredientCategories.flatMap((category) => category.ingredients);

      expect(ingredients.some((ingredient) => ingredient.isMandatory)).toBe(true);
      expect(
        ingredients.some(
          (ingredient) => !ingredient.isMandatory && ingredient.isDefault
        )
      ).toBe(true);
      expect(
        ingredients.some(
          (ingredient) => !ingredient.isMandatory && !ingredient.isDefault
        )
      ).toBe(true);
    }
  });

  it('keeps mandatory ingredients selected by default', () => {
    for (const dish of CURATED_MENU_DISHES) {
      const mandatoryIngredients = dish.ingredientCategories.flatMap((category) =>
        category.ingredients.filter((ingredient) => ingredient.isMandatory)
      );

      for (const ingredient of mandatoryIngredients) {
        expect(ingredient.isDefault).toBe(true);
      }
    }
  });

  it('avoids duplicate ingredient names within a dish', () => {
    for (const dish of CURATED_MENU_DISHES) {
      const loweredNames = dish.ingredientCategories.flatMap((category) =>
        category.ingredients.map((ingredient) => ingredient.name.trim().toLowerCase())
      );
      expect(new Set(loweredNames).size).toBe(loweredNames.length);
    }
  });
});
