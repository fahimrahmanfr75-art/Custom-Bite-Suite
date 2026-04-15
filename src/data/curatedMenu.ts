export type CuratedIngredientInput = {
  name: string;
  isMandatory?: boolean;
  isDefault?: boolean;
  extraPrice?: number;
};

export type CuratedIngredientCategoryInput = {
  name: string;
  description: string;
  ingredients: CuratedIngredientInput[];
};

export type CuratedDishInput = {
  categoryName: string;
  name: string;
  description: string;
  price: number;
  prepTimeMinutes: number;
  calories: number;
  spiceLevel: string;
  imageUrl: string;
  ingredientCategories: CuratedIngredientCategoryInput[];
};

export type CuratedCategoryInput = {
  name: string;
  description: string;
  sortOrder: number;
};

const ingredient = (
  name: string,
  options: Omit<CuratedIngredientInput, 'name'> = {}
): CuratedIngredientInput => ({
  name,
  isMandatory: options.isMandatory ?? false,
  isDefault: options.isDefault ?? false,
  extraPrice: options.extraPrice ?? 0,
});

const categoryGroup = (
  name: string,
  description: string,
  ingredients: CuratedIngredientInput[]
): CuratedIngredientCategoryInput => ({
  name,
  description,
  ingredients,
});

export const CURATED_MENU_CATEGORIES: CuratedCategoryInput[] = [
  {
    name: 'Amuse & Starters',
    description: 'Precision-built opening plates with bright acidity, texture, and restraint.',
    sortOrder: 1,
  },
  {
    name: 'Salads & Cheese',
    description: 'Fresh market greens, artisan dairy, and composed vegetable plates.',
    sortOrder: 2,
  },
  {
    name: 'Handmade Pasta',
    description: 'Fresh pasta finished with refined sauces and layered garnishes.',
    sortOrder: 3,
  },
  {
    name: 'Sea & Shore',
    description: 'Seafood mains with polished sauces, grains, and seasonal vegetables.',
    sortOrder: 4,
  },
  {
    name: 'From the Grill',
    description: 'Prime meats, careful jus work, and steakhouse-grade accompaniments.',
    sortOrder: 5,
  },
  {
    name: 'Seasonal Sides',
    description: 'Elegant supporting plates designed to complete the table.',
    sortOrder: 6,
  },
  {
    name: 'Desserts',
    description: 'Classic pastry techniques with modern restaurant finishing.',
    sortOrder: 7,
  },
  {
    name: 'Cocktails & Zero Proof',
    description: 'Bar-program signatures with spirit-forward and non-alcoholic options.',
    sortOrder: 8,
  },
];

export const CURATED_MENU_DISHES: CuratedDishInput[] = [
  {
    categoryName: 'Amuse & Starters',
    name: 'Yellowtail Crudo',
    description: 'Thin-sliced yellowtail with citrus, cucumber, herbs, and restrained heat.',
    price: 18,
    prepTimeMinutes: 12,
    calories: 320,
    spiceLevel: 'Mild',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Seafood', 'Core protein that defines the dish.', [
        ingredient('Yellowtail', { isMandatory: true, isDefault: true, }),
      ]),
      categoryGroup('Citrus & Garden', 'Bright, cooling, and aromatic elements.', [
        ingredient('Blood Orange', { isDefault: true }),
        ingredient('Compressed Cucumber', { isDefault: true }),
        ingredient('Finger Lime', { isDefault: true }),
        ingredient('Thai Basil', { isDefault: true }),
        ingredient('Avocado', { extraPrice: 2.5 }),
        ingredient('Fresno Chili', { extraPrice: 1 }),
      ]),
      categoryGroup('Finish', 'Final seasoning and texture.', [
        ingredient('Yuzu Dressing', { isDefault: true, }),
        ingredient('Chive Oil', { isDefault: true }),
        ingredient('Toasted Sesame', { isDefault: true, }),
        ingredient('Crispy Shallot', { extraPrice: 1.2 }),
      ]),
    ],
  },
  {
    categoryName: 'Amuse & Starters',
    name: 'Truffle Beef Tartare',
    description: 'Hand-cut prime tenderloin with classic tartare seasoning and warm brioche.',
    price: 21,
    prepTimeMinutes: 14,
    calories: 460,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Foundation', 'Primary protein and base seasoning.', [
        ingredient('Hand-cut Tenderloin', { isMandatory: true, isDefault: true }),
        ingredient('Confit Egg Yolk', { isDefault: true, }),
      ]),
      categoryGroup('Seasoning', 'Traditional tartare aromatics.', [
        ingredient('Shallot Brunoise', { isDefault: true }),
        ingredient('Capers', { isDefault: true }),
        ingredient('Cornichon', { isDefault: true }),
        ingredient('Dijon Mustard', { isDefault: true }),
        ingredient('Chives', { isDefault: true }),
        ingredient('Smoked Sea Salt', { extraPrice: 0.8 }),
      ]),
      categoryGroup('Accompaniments', 'Luxury and texture additions.', [
        ingredient('Brioche Soldiers', { isDefault: true, }),
        ingredient('Black Truffle', { extraPrice: 8 }),
        ingredient('Quail Egg', { extraPrice: 2.5, }),
        ingredient('Parmesan Crisps', { extraPrice: 2, }),
      ]),
    ],
  },
  {
    categoryName: 'Salads & Cheese',
    name: 'Burrata di Puglia',
    description: 'Creamy burrata with heirloom tomato, stone fruit, basil oil, and aged balsamic.',
    price: 17,
    prepTimeMinutes: 10,
    calories: 510,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Cheese', 'The primary dairy component.', [
        ingredient('Burrata', { isMandatory: true, isDefault: true, }),
      ]),
      categoryGroup('Produce', 'Fresh and sweet counterpoints.', [
        ingredient('Heirloom Tomato', { isDefault: true }),
        ingredient('Peach Mostarda', { isDefault: true }),
        ingredient('Baby Basil', { isDefault: true }),
        ingredient('Pickled Strawberry', { extraPrice: 2 }),
        ingredient('Prosciutto di Parma', { extraPrice: 4 }),
      ]),
      categoryGroup('Finish', 'Acid, crunch, and service pieces.', [
        ingredient('Basil Oil', { isDefault: true }),
        ingredient('Aged Balsamic', { isDefault: true }),
        ingredient('Sea Salt', { isDefault: true }),
        ingredient('Toasted Pistachio', { extraPrice: 2.2, }),
        ingredient('Grilled Sourdough', { extraPrice: 2.5, }),
      ]),
    ],
  },
  {
    categoryName: 'Salads & Cheese',
    name: 'Charred Gem Caesar',
    description: 'Little gem lettuce with anchovy dressing, parmesan, soft egg, and garlic crumb.',
    price: 16,
    prepTimeMinutes: 11,
    calories: 430,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Greens', 'The structural base of the salad.', [
        ingredient('Little Gem Lettuce', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('Classic Caesar Build', 'Signature caesar components.', [
        ingredient('Anchovy Dressing', { isDefault: true, }),
        ingredient('Parmigiano Reggiano', { isDefault: true, }),
        ingredient('Soft Egg', { isDefault: true, }),
        ingredient('Lemon Zest', { isDefault: true }),
        ingredient('White Anchovy', { extraPrice: 3.5, }),
      ]),
      categoryGroup('Texture & Additions', 'Crunch and richer toppings.', [
        ingredient('Garlic Crumb', { isDefault: true, }),
        ingredient('Grilled Chicken', { extraPrice: 6 }),
        ingredient('Avocado', { extraPrice: 2.5 }),
        ingredient('Crispy Pancetta', { extraPrice: 3.5 }),
      ]),
    ],
  },
  {
    categoryName: 'Handmade Pasta',
    name: 'Lobster Saffron Tagliolini',
    description: 'Fine fresh pasta with butter-poached lobster, saffron cream, and bright herbs.',
    price: 32,
    prepTimeMinutes: 18,
    calories: 710,
    spiceLevel: 'Mild',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Pasta & Shellfish', 'The central pasta composition.', [
        ingredient('Fresh Tagliolini', { isMandatory: true, isDefault: true, }),
        ingredient('Butter-poached Lobster', {
          isMandatory: true,
          isDefault: true,

        }),
      ]),
      categoryGroup('Sauce', 'Primary sauce and aromatic finish.', [
        ingredient('Saffron Shellfish Cream', { isDefault: true, }),
        ingredient('Tarragon', { isDefault: true }),
        ingredient('Confit Tomato', { isDefault: true }),
        ingredient('Lemon Crumb', { isDefault: true, }),
        ingredient('Calabrian Chili Oil', { extraPrice: 1 }),
      ]),
      categoryGroup('Enhancements', 'Luxury additions and extra seafood.', [
        ingredient('Oscietra Caviar', { extraPrice: 12, }),
        ingredient('Brown Butter Breadcrumbs', { extraPrice: 2, }),
        ingredient('Grilled Prawn', { extraPrice: 7, }),
      ]),
    ],
  },
  {
    categoryName: 'Handmade Pasta',
    name: 'Wild Mushroom Agnolotti',
    description: 'House agnolotti filled with ricotta and mushroom duxelles in sage butter broth.',
    price: 24,
    prepTimeMinutes: 17,
    calories: 620,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Pasta', 'Fresh filled pasta that defines the plate.', [
        ingredient('Agnolotti Pasta', { isMandatory: true, isDefault: true, }),
        ingredient('Ricotta Mushroom Filling', {
          isMandatory: true,
          isDefault: true,

        }),
      ]),
      categoryGroup('Sauce & Vegetables', 'Savory depth and woodland aromatics.', [
        ingredient('Parmesan Brodo', { isDefault: true, }),
        ingredient('Sage Butter', { isDefault: true, }),
        ingredient('Roasted Maitake', { isDefault: true }),
        ingredient('Chive', { isDefault: true }),
        ingredient('Preserved Lemon', { extraPrice: 1.2 }),
      ]),
      categoryGroup('Enhancements', 'Premium finishing additions.', [
        ingredient('Black Truffle', { extraPrice: 8 }),
        ingredient('Hazelnut Crumble', { extraPrice: 2, }),
        ingredient('Stracciatella', { extraPrice: 3.5, }),
      ]),
    ],
  },
  {
    categoryName: 'Sea & Shore',
    name: 'Miso Black Cod',
    description: 'Caramelized black cod with jasmine rice, sesame spinach, and yuzu brightness.',
    price: 34,
    prepTimeMinutes: 19,
    calories: 680,
    spiceLevel: 'Mild',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Seafood', 'Primary fish component.', [
        ingredient('Black Cod', { isMandatory: true, isDefault: true, }),
      ]),
      categoryGroup('Plate Build', 'Core side items served with the fish.', [
        ingredient('White Miso Glaze', { isDefault: true, }),
        ingredient('Jasmine Rice', { isDefault: true }),
        ingredient('Sesame Spinach', { isDefault: true, }),
        ingredient('Pickled Daikon', { isDefault: true }),
        ingredient('Charred Scallion', { isDefault: true }),
      ]),
      categoryGroup('Chef Additions', 'Extra richness and texture.', [
        ingredient('Yuzu Beurre Blanc', { extraPrice: 3, }),
        ingredient('Ikura', { extraPrice: 5, }),
        ingredient('Tempura Enoki', { extraPrice: 2.5, }),
      ]),
    ],
  },
  {
    categoryName: 'Sea & Shore',
    name: 'Diver Scallops',
    description: 'Pan-seared scallops over sweet corn puree with brown butter and pancetta crumb.',
    price: 31,
    prepTimeMinutes: 16,
    calories: 540,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Seafood', 'The featured shellfish.', [
        ingredient('Diver Scallops', { isMandatory: true, isDefault: true, }),
      ]),
      categoryGroup('Vegetables & Puree', 'Core accompaniment and freshness.', [
        ingredient('Sweet Corn Puree', { isDefault: true, }),
        ingredient('Baby Fennel Salad', { isDefault: true }),
        ingredient('Chive Oil', { isDefault: true }),
        ingredient('Brown Butter', { isDefault: true, }),
      ]),
      categoryGroup('Texture & Additions', 'Crunchy and premium finishers.', [
        ingredient('Pancetta Crumb', { isDefault: true, }),
        ingredient('Trout Roe', { extraPrice: 4.5, }),
        ingredient('Grilled Asparagus', { extraPrice: 3 }),
        ingredient('Preserved Lemon', { extraPrice: 1.2 }),
      ]),
    ],
  },
  {
    categoryName: 'From the Grill',
    name: 'Dry-Aged Ribeye',
    description: 'Wood-fired ribeye with roasted garlic jus, smoked shallot, and watercress.',
    price: 42,
    prepTimeMinutes: 24,
    calories: 930,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Grill', 'Primary cut of meat.', [
        ingredient('Dry-Aged Ribeye', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('House Garnish', 'Standard steak service and finishing.', [
        ingredient('Roasted Garlic Jus', { isDefault: true }),
        ingredient('Smoked Shallot', { isDefault: true }),
        ingredient('Watercress', { isDefault: true }),
        ingredient('Maldon Salt', { isDefault: true }),
      ]),
      categoryGroup('Enhancements', 'Classic steakhouse upgrades.', [
        ingredient('Foie Gras Butter', { extraPrice: 7, }),
        ingredient('Truffle Fries', { extraPrice: 6, }),
        ingredient('Grilled Prawns', { extraPrice: 9, }),
      ]),
    ],
  },
  {
    categoryName: 'From the Grill',
    name: 'Herb Butter Chicken Supreme',
    description: 'Airline chicken breast with pomme puree, charred leek, and glossy chicken jus.',
    price: 28,
    prepTimeMinutes: 20,
    calories: 740,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Protein', 'The principal roasted meat.', [
        ingredient('Chicken Supreme', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('Plate Build', 'Default accompaniments and sauce.', [
        ingredient('Chicken Jus', { isDefault: true }),
        ingredient('Pommes Puree', { isDefault: true, }),
        ingredient('Charred Leek', { isDefault: true }),
        ingredient('Tarragon Butter', { isDefault: true, }),
      ]),
      categoryGroup('Enhancements', 'Extra richness for guests who want more depth.', [
        ingredient('Black Garlic Glaze', { extraPrice: 2 }),
        ingredient('Roasted Mushrooms', { extraPrice: 3 }),
        ingredient('Shaved Truffle', { extraPrice: 8 }),
      ]),
    ],
  },
  {
    categoryName: 'Seasonal Sides',
    name: 'Pommes Puree',
    description: 'Silk-smooth potato puree enriched with cultured butter and creme fraiche.',
    price: 9,
    prepTimeMinutes: 8,
    calories: 330,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Foundation', 'Essential side build.', [
        ingredient('Yukon Gold Potato', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('Enrichment', 'Default dairy and seasoning.', [
        ingredient('Cultured Butter', { isDefault: true, }),
        ingredient('Creme Fraiche', { isDefault: true, }),
        ingredient('Chive', { isDefault: true }),
      ]),
      categoryGroup('Additions', 'Optional finishing upgrades.', [
        ingredient('Comte', { extraPrice: 2.5, }),
        ingredient('Black Truffle', { extraPrice: 7 }),
        ingredient('Crispy Shallot', { extraPrice: 1.2 }),
      ]),
    ],
  },
  {
    categoryName: 'Seasonal Sides',
    name: 'Charred Broccolini',
    description: 'Broccolini with garlic confit, lemon, chili oil, and toasted almonds.',
    price: 10,
    prepTimeMinutes: 9,
    calories: 240,
    spiceLevel: 'Mild',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Vegetable', 'Primary produce component.', [
        ingredient('Broccolini', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('Default Seasoning', 'Standard aromatic finish.', [
        ingredient('Garlic Confit', { isDefault: true }),
        ingredient('Lemon', { isDefault: true }),
        ingredient('Chili Oil', { isDefault: true }),
        ingredient('Toasted Almond', { isDefault: true, }),
      ]),
      categoryGroup('Additions', 'Optional richer toppings.', [
        ingredient('Pecorino', { extraPrice: 2, }),
        ingredient('Anchovy Crumb', { extraPrice: 2.5, }),
        ingredient('Burrata', { extraPrice: 4, }),
      ]),
    ],
  },
  {
    categoryName: 'Desserts',
    name: 'Valrhona Chocolate Delice',
    description: 'Dark chocolate mousse cake with praline crunch and espresso anglaise.',
    price: 14,
    prepTimeMinutes: 7,
    calories: 520,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Core Dessert', 'Primary chocolate structure.', [
        ingredient('Valrhona Chocolate Mousse', {
          isMandatory: true,
          isDefault: true,

        }),
        ingredient('Cocoa Sponge', { isDefault: true, }),
      ]),
      categoryGroup('Default Finish', 'House garnish and sauce.', [
        ingredient('Hazelnut Praline Crunch', { isDefault: true, }),
        ingredient('Espresso Anglaise', { isDefault: true, }),
        ingredient('Sea Salt Flakes', { isDefault: true }),
      ]),
      categoryGroup('Additions', 'Optional pastry upgrades.', [
        ingredient('Vanilla Ice Cream', { extraPrice: 2.5, }),
        ingredient('Macerated Berries', { extraPrice: 2 }),
        ingredient('Cocoa Nib Tuile', { extraPrice: 1.8, }),
      ]),
    ],
  },
  {
    categoryName: 'Desserts',
    name: 'Vanilla Bean Creme Brulee',
    description: 'Classic vanilla custard with a brûléed top, berries, and sable biscuit.',
    price: 13,
    prepTimeMinutes: 6,
    calories: 470,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Custard', 'Foundational dessert component.', [
        ingredient('Vanilla Custard', { isMandatory: true, isDefault: true, }),
      ]),
      categoryGroup('Default Garnish', 'House service accompaniments.', [
        ingredient('Caramelized Sugar Top', { isDefault: true }),
        ingredient('Shortbread Sable', { isDefault: true, }),
        ingredient('Macerated Berries', { isDefault: true }),
      ]),
      categoryGroup('Additions', 'Optional finishing touches.', [
        ingredient('Candied Citrus', { extraPrice: 1.5 }),
        ingredient('Pistachio Brittle', { extraPrice: 2.2, }),
        ingredient('Whipped Mascarpone', { extraPrice: 2, }),
      ]),
    ],
  },
  {
    categoryName: 'Cocktails & Zero Proof',
    name: 'Citrus Blossom Spritz',
    description: 'A bright zero-proof spritz with orange blossom, grapefruit, mint, and soda lift.',
    price: 12,
    prepTimeMinutes: 4,
    calories: 140,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Base', 'Primary liquid structure.', [
        ingredient('Sparkling Citrus Base', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('Default Build', 'Standard bar setup.', [
        ingredient('Orange Blossom Cordial', { isDefault: true }),
        ingredient('Pink Grapefruit', { isDefault: true }),
        ingredient('Soda Water', { isDefault: true }),
        ingredient('Mint', { isDefault: true }),
      ]),
      categoryGroup('Bar Upgrades', 'Optional aromatic additions.', [
        ingredient('Rosemary Smoke', { extraPrice: 1.5 }),
        ingredient('Zero-Proof Aperitif', { extraPrice: 3 }),
        ingredient('Dehydrated Citrus Wheel', { extraPrice: 1 }),
      ]),
    ],
  },
  {
    categoryName: 'Cocktails & Zero Proof',
    name: 'Smoked Pineapple Old Fashioned',
    description: 'Bourbon old fashioned with smoked pineapple reduction, bitters, and orange oil.',
    price: 16,
    prepTimeMinutes: 5,
    calories: 190,
    spiceLevel: 'None',
    imageUrl: '',
    ingredientCategories: [
      categoryGroup('Spirit', 'Primary cocktail foundation.', [
        ingredient('Bourbon', { isMandatory: true, isDefault: true }),
      ]),
      categoryGroup('Default Build', 'House spec for the drink.', [
        ingredient('Smoked Pineapple Reduction', { isDefault: true }),
        ingredient('Aromatic Bitters', { isDefault: true }),
        ingredient('Orange Oil', { isDefault: true }),
        ingredient('Large Ice Cube', { isDefault: true }),
      ]),
      categoryGroup('Bar Upgrades', 'Optional garnish and sweetness adjustments.', [
        ingredient('Luxardo Cherry', { extraPrice: 1.5 }),
        ingredient('Demerara Float', { extraPrice: 1 }),
        ingredient('Candied Ginger', { extraPrice: 1.2 }),
      ]),
    ],
  },
];

export const CURATED_BANNERS = [
  {
    imageUrl: 'https://via.placeholder.com/1200x300?text=Chef%27s+Coastal+Menu',
    title: 'Chef\'s Coastal Signatures',
    description: 'Black cod, scallops, and lobster pasta define the current house menu.',
    isActive: true,
    sortOrder: 1,
  },
  {
    imageUrl: 'https://via.placeholder.com/1200x300?text=Grill+%26+Dessert+Pairing',
    title: 'Grill and Dessert Pairing',
    description: 'Build a full dinner with steakhouse mains and polished pastry finishes.',
    isActive: true,
    sortOrder: 2,
  },
];

export const CURATED_OFFERS = [
  {
    title: 'Midweek Chef Selection',
    description: '10% off any pasta or seafood main ordered before 8 PM.',
    discountPercent: 10,
    activeFrom: '2026-01-01T00:00:00.000Z',
    activeTo: '2027-01-01T00:00:00.000Z',
    bannerColor: '#243746',
  },
  {
    title: 'Dessert Service',
    description: 'Complimentary coffee with any two plated desserts.',
    discountPercent: 6,
    activeFrom: '2026-01-01T00:00:00.000Z',
    activeTo: '2027-01-01T00:00:00.000Z',
    bannerColor: '#7D5A3C',
  },
];

export const LEGACY_SAMPLE_DISH_NAMES = [
  'Fireline Chicken Burger',
  'Stackhouse Beef Burger',
  'Power Bowl',
  'Loaded Fries',
  'Citrus Cola Cooler',
];
