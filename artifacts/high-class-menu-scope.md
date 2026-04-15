## Scope

- Replace the customer-facing live menu with a curated high-end restaurant menu.
- Preserve legacy seeded dishes only for historical order joins by marking them unavailable.
- Publish new categories, dishes, ingredient groups, banners, and offers at repository initialization.

## Menu Rules

- Mandatory ingredients are inserted with `isMandatory = true`, `isDefault = true`, `extraPrice = 0`.
- Default-selected removable ingredients are inserted with `isMandatory = false`, `isDefault = true`.
- Optional extras are inserted with `isMandatory = false`, `isDefault = false`.
- Categories are dish-specific and rebuilt on sync so each plate keeps a coherent ingredient structure.

## Validation

- Jest coverage: [__tests__/curatedMenu.test.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/__tests__/curatedMenu.test.ts:1)
- Runtime sync source: [src/data/curatedMenu.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/curatedMenu.ts:1)
- Repository integration: [src/data/repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1)
