type CuratedMenuCategory = {
  name: string;
  description: string;
  sortOrder: number;
};

type CuratedMenuIngredient = {
  name: string;
  isMandatory: boolean;
  isDefault: boolean;
  extraPrice: number;
  canAdd: boolean;
  canRemove: boolean;
  sortOrder: number;
};

type CuratedMenuIngredientCategory = {
  name: string;
  description: string;
  sortOrder: number;
  ingredients: CuratedMenuIngredient[];
};

type CuratedMenuDish = {
  categoryName: string;
  name: string;
  description: string;
  price: number;
  prepTimeMinutes: number;
  calories: number;
  spiceLevel: string;
  ingredientCategories: CuratedMenuIngredientCategory[];
};

export const CURATED_MENU_CATEGORIES: CuratedMenuCategory[] = [
  { name: 'Signature Burgers', description: 'High-protein burgers with ingredient transparency.', sortOrder: 1 },
  { name: 'Rice Bowls', description: 'Balanced bowls for lunch and dinner.', sortOrder: 2 },
  { name: 'Sides', description: 'Quick add-ons and snacks.', sortOrder: 3 },
  { name: 'Drinks', description: 'Fresh beverages and shakes.', sortOrder: 4 },
];

export const CURATED_MENU_DISHES: CuratedMenuDish[] = [
  {
    categoryName: 'Signature Burgers',
    name: 'Fireline Chicken Burger',
    description: 'Smoky grilled chicken, cheddar, jalapeno, and garlic mayo.',
    price: 8.9,
    prepTimeMinutes: 18,
    calories: 650,
    spiceLevel: 'Medium',
    ingredientCategories: [
      {
        name: 'Foundation',
        description: 'Core structure of the burger.',
        sortOrder: 0,
        ingredients: [
          { name: 'Brioche Bun', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 0 },
          { name: 'Chicken Patty', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 1 },
        ],
      },
      {
        name: 'Fresh Layer',
        description: 'Included vegetables and sauce.',
        sortOrder: 1,
        ingredients: [
          { name: 'Lettuce', isMandatory: false, isDefault: true, extraPrice: 0, canAdd: true, canRemove: true, sortOrder: 0 },
          { name: 'Tomato', isMandatory: false, isDefault: true, extraPrice: 0, canAdd: true, canRemove: true, sortOrder: 1 },
          { name: 'Cheddar', isMandatory: false, isDefault: true, extraPrice: 1.2, canAdd: true, canRemove: true, sortOrder: 2 },
          { name: 'Jalapeno', isMandatory: false, isDefault: true, extraPrice: 0.75, canAdd: true, canRemove: true, sortOrder: 3 },
          { name: 'Garlic Mayo', isMandatory: false, isDefault: true, extraPrice: 0.5, canAdd: true, canRemove: true, sortOrder: 4 },
        ],
      },
      {
        name: 'Extras',
        description: 'Optional paid add-ons.',
        sortOrder: 2,
        ingredients: [
          { name: 'Avocado', isMandatory: false, isDefault: false, extraPrice: 1.5, canAdd: true, canRemove: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    categoryName: 'Signature Burgers',
    name: 'Stackhouse Beef Burger',
    description: 'Double beef with caramelized onion and house pickle.',
    price: 10.5,
    prepTimeMinutes: 20,
    calories: 790,
    spiceLevel: 'Mild',
    ingredientCategories: [
      {
        name: 'Foundation',
        description: 'Base build of the burger.',
        sortOrder: 0,
        ingredients: [
          { name: 'Brioche Bun', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 0 },
          { name: 'Beef Patty', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 1 },
        ],
      },
      {
        name: 'Toppings',
        description: 'Vegetables and flavor accents.',
        sortOrder: 1,
        ingredients: [
          { name: 'Lettuce', isMandatory: false, isDefault: true, extraPrice: 0, canAdd: true, canRemove: true, sortOrder: 0 },
          { name: 'Caramelized Onion', isMandatory: false, isDefault: true, extraPrice: 0.6, canAdd: true, canRemove: true, sortOrder: 1 },
          { name: 'House Pickle', isMandatory: false, isDefault: true, extraPrice: 0.4, canAdd: true, canRemove: true, sortOrder: 2 },
        ],
      },
      {
        name: 'Extras',
        description: 'Optional premium additions.',
        sortOrder: 2,
        ingredients: [
          { name: 'Cheddar', isMandatory: false, isDefault: false, extraPrice: 1.2, canAdd: true, canRemove: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    categoryName: 'Rice Bowls',
    name: 'Power Bowl',
    description: 'Basmati rice with grilled chicken, cucumber, yogurt sauce, and herbs.',
    price: 9.6,
    prepTimeMinutes: 16,
    calories: 560,
    spiceLevel: 'Mild',
    ingredientCategories: [
      {
        name: 'Foundation',
        description: 'Core bowl ingredients.',
        sortOrder: 0,
        ingredients: [
          { name: 'Basmati Rice', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 0 },
          { name: 'Grilled Chicken', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 1 },
        ],
      },
      {
        name: 'Fresh Layer',
        description: 'Cooling toppings and sauces.',
        sortOrder: 1,
        ingredients: [
          { name: 'Cucumber', isMandatory: false, isDefault: true, extraPrice: 0, canAdd: true, canRemove: true, sortOrder: 0 },
          { name: 'Greek Yogurt Sauce', isMandatory: false, isDefault: true, extraPrice: 0.6, canAdd: true, canRemove: true, sortOrder: 1 },
        ],
      },
      {
        name: 'Extras',
        description: 'Optional bowl additions.',
        sortOrder: 2,
        ingredients: [
          { name: 'Avocado', isMandatory: false, isDefault: false, extraPrice: 1.5, canAdd: true, canRemove: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    categoryName: 'Sides',
    name: 'Loaded Fries',
    description: 'Crisp fries with cheddar, onion, and sauce drizzle.',
    price: 4.8,
    prepTimeMinutes: 10,
    calories: 420,
    spiceLevel: 'Medium',
    ingredientCategories: [
      {
        name: 'Foundation',
        description: 'Crisp fry base.',
        sortOrder: 0,
        ingredients: [
          { name: 'Loaded Fries Base', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 0 },
        ],
      },
      {
        name: 'Loaded Stack',
        description: 'Primary fries toppings.',
        sortOrder: 1,
        ingredients: [
          { name: 'Cheddar', isMandatory: false, isDefault: true, extraPrice: 0.8, canAdd: true, canRemove: true, sortOrder: 0 },
          { name: 'Caramelized Onion', isMandatory: false, isDefault: true, extraPrice: 0.5, canAdd: true, canRemove: true, sortOrder: 1 },
          { name: 'Garlic Mayo', isMandatory: false, isDefault: true, extraPrice: 0.5, canAdd: true, canRemove: true, sortOrder: 2 },
        ],
      },
      {
        name: 'Extras',
        description: 'Optional add-ons.',
        sortOrder: 2,
        ingredients: [
          { name: 'Jalapeno', isMandatory: false, isDefault: false, extraPrice: 0.4, canAdd: true, canRemove: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    categoryName: 'Drinks',
    name: 'Citrus Cola Cooler',
    description: 'Citrus-spiked cola over ice.',
    price: 2.9,
    prepTimeMinutes: 4,
    calories: 120,
    spiceLevel: 'None',
    ingredientCategories: [
      {
        name: 'Foundation',
        description: 'Base beverage composition.',
        sortOrder: 0,
        ingredients: [
          { name: 'Cola', isMandatory: true, isDefault: true, extraPrice: 0, canAdd: false, canRemove: false, sortOrder: 0 },
        ],
      },
      {
        name: 'Included',
        description: 'Standard beverage finish.',
        sortOrder: 1,
        ingredients: [
          { name: 'Citrus Slice', isMandatory: false, isDefault: true, extraPrice: 0, canAdd: true, canRemove: true, sortOrder: 0 },
        ],
      },
      {
        name: 'Extras',
        description: 'Optional beverage extras.',
        sortOrder: 2,
        ingredients: [
          { name: 'Extra Ice', isMandatory: false, isDefault: false, extraPrice: 0, canAdd: true, canRemove: false, sortOrder: 0 },
        ],
      },
    ],
  },
];
