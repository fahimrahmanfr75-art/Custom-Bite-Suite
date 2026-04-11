# Custom-Bite Suite Project Outline

## Scope
- Android-first single-vendor food delivery app for one restaurant.
- Three roles: customer, manager, rider.
- Local-first relational persistence with SQLite and seeded demo accounts.
- MVP coverage of every mandatory requirement from `Prompt.md`.

## Sequential Delivery Map
1. Environment bootstrap with Expo SDK 54, TypeScript, SQLite, maps, validation, testing, linting.
2. Relational schema for users, sessions, categories, dishes, ingredients, dish ingredient rules, offers, orders, order items, customizations, reviews, refunds, and audit logs.
3. Authentication layer with role-specific login and registration, uniqueness validation on username/email/phone, and password hashing with SHA-256.
4. Customer flow:
   - Search by dish name or ingredient.
   - Browse categories and active offers.
   - Customize dishes by add/remove ingredient rules.
   - Manage digital cart and COD/card selection.
   - Track order state from accepted to delivered.
   - See rider assignment/contact.
   - Submit refunds.
   - View history and leave reviews.
5. Manager flow:
   - Real-time dish CRUD.
   - Filter order board by status.
   - Assign rider.
   - Advance operational status.
   - Review refund requests.
   - See earnings analytics and outstanding COD.
   - Inspect audit logs.
6. Rider flow:
   - View assigned deliveries with customer contact and notes.
   - Use embedded map marker and native maps deep link.
   - Advance status.
   - Confirm COD cash collected.
7. Validation:
   - Unit tests for financial/status logic.
   - TypeScript compile check.
   - ESLint pass target.

## Demo Credentials
- Customer: `sara` / `Customer123`
- Manager: `manager` / `Manager123`
- Rider: `rider1` / `Rider123`
