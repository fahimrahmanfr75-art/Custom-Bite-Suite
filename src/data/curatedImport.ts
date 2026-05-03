import { db } from './schema';
import { CURATED_MENU_CATEGORIES, CURATED_MENU_DISHES } from './curatedMenu';

type ImportCuratedContentOptions = {
  mode: 'merge_curated_owned';
};

type CuratedRow = {
  id: number;
  source: string | null;
  external_key: string | null;
};

const CURATED_BANNERS = [
  {
    externalKey: 'banner:lunch-saver',
    imageUrl: 'https://custombite.example/assets/lunch-saver.jpg',
    title: 'Weekday Lunch Saver',
    description: 'Light lunch promos for midday traffic.',
    isActive: 1,
    sortOrder: 0,
  },
];

const CURATED_OFFERS = [
  {
    externalKey: 'offer:weekday-lunch-saver',
    title: 'Weekday Lunch Saver',
    description: '12% off bowls before 3 PM.',
    discountPercent: 12,
    activeFrom: '2026-01-01T00:00:00.000Z',
    activeTo: '2027-01-01T00:00:00.000Z',
    bannerColor: '#D45D31',
  },
];

function canOverwriteCuratedRow(row: CuratedRow | null) {
  return !row || row.source !== 'operator';
}

export async function importCuratedContent(_options: ImportCuratedContentOptions): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const category of CURATED_MENU_CATEGORIES) {
      const externalKey = `category:${category.name.toLowerCase().replace(/\s+/g, '-')}`;
      const existing = await txn.getFirstAsync<CuratedRow>(
        `SELECT id, source, external_key
         FROM categories
         WHERE external_key = ?
            OR lower(name) = lower(?)`,
        externalKey,
        category.name
      );

      if (!canOverwriteCuratedRow(existing)) {
        continue;
      }

      if (existing) {
        await txn.runAsync(
          `UPDATE categories
           SET name = ?, description = ?, sort_order = ?, source = 'curated_import', external_key = ?
           WHERE id = ?`,
          category.name,
          category.description,
          category.sortOrder,
          externalKey,
          existing.id
        );
        continue;
      }

      await txn.runAsync(
        `INSERT INTO categories
          (name, description, sort_order, source, external_key)
         VALUES (?, ?, ?, 'curated_import', ?)`,
        category.name,
        category.description,
        category.sortOrder,
        externalKey
      );
    }

    for (const dish of CURATED_MENU_DISHES) {
      const externalKey = `dish:${dish.name.toLowerCase().replace(/\s+/g, '-')}`;
      const existing = await txn.getFirstAsync<CuratedRow>(
        `SELECT id, source, external_key
         FROM dishes
         WHERE external_key = ?
            OR lower(name) = lower(?)`,
        externalKey,
        dish.name
      );

      if (!canOverwriteCuratedRow(existing)) {
        continue;
      }

      const category = await txn.getFirstAsync<{ id: number }>(
        `SELECT id FROM categories WHERE lower(name) = lower(?)`,
        dish.categoryName
      );
      if (!category) {
        continue;
      }

      if (existing) {
        await txn.runAsync(
          `UPDATE dishes
           SET category_id = ?, name = ?, description = ?, price = ?, prep_time_minutes = ?, calories = ?, spice_level = ?, is_available = 1, source = 'curated_import', external_key = ?
           WHERE id = ?`,
          category.id,
          dish.name,
          dish.description,
          dish.price,
          dish.prepTimeMinutes,
          dish.calories,
          dish.spiceLevel,
          externalKey,
          existing.id
        );
        continue;
      }

      await txn.runAsync(
        `INSERT INTO dishes
          (category_id, name, description, price, prep_time_minutes, calories, spice_level, is_available, image_url, created_at, source, external_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, '', ?, 'curated_import', ?)`,
        category.id,
        dish.name,
        dish.description,
        dish.price,
        dish.prepTimeMinutes,
        dish.calories,
        dish.spiceLevel,
        new Date().toISOString(),
        externalKey
      );
    }

    for (const banner of CURATED_BANNERS) {
      const existing = await txn.getFirstAsync<CuratedRow>(
        `SELECT id, source, external_key
         FROM banner_images
         WHERE external_key = ?
            OR lower(title) = lower(?)`,
        banner.externalKey,
        banner.title
      );

      if (!canOverwriteCuratedRow(existing)) {
        continue;
      }

      if (existing) {
        await txn.runAsync(
          `UPDATE banner_images
           SET image_url = ?, title = ?, description = ?, is_active = ?, sort_order = ?, source = 'curated_import', external_key = ?
           WHERE id = ?`,
          banner.imageUrl,
          banner.title,
          banner.description,
          banner.isActive,
          banner.sortOrder,
          banner.externalKey,
          existing.id
        );
        continue;
      }

      await txn.runAsync(
        `INSERT INTO banner_images
          (image_url, title, description, is_active, sort_order, created_at, source, external_key)
         VALUES (?, ?, ?, ?, ?, ?, 'curated_import', ?)`,
        banner.imageUrl,
        banner.title,
        banner.description,
        banner.isActive,
        banner.sortOrder,
        new Date().toISOString(),
        banner.externalKey
      );
    }

    for (const offer of CURATED_OFFERS) {
      const existing = await txn.getFirstAsync<CuratedRow>(
        `SELECT id, source, external_key
         FROM offers
         WHERE external_key = ?
            OR lower(title) = lower(?)`,
        offer.externalKey,
        offer.title
      );

      if (!canOverwriteCuratedRow(existing)) {
        continue;
      }

      if (existing) {
        await txn.runAsync(
          `UPDATE offers
           SET title = ?, description = ?, discount_percent = ?, active_from = ?, active_to = ?, banner_color = ?, source = 'curated_import', external_key = ?
           WHERE id = ?`,
          offer.title,
          offer.description,
          offer.discountPercent,
          offer.activeFrom,
          offer.activeTo,
          offer.bannerColor,
          offer.externalKey,
          existing.id
        );
        continue;
      }

      await txn.runAsync(
        `INSERT INTO offers
          (title, description, discount_percent, active_from, active_to, banner_color, source, external_key)
         VALUES (?, ?, ?, ?, ?, ?, 'curated_import', ?)`,
        offer.title,
        offer.description,
        offer.discountPercent,
        offer.activeFrom,
        offer.activeTo,
        offer.bannerColor,
        offer.externalKey
      );
    }
  });
}
