// @ts-nocheck
/**
 * Migration Script: Move existing file-based images to Media table in DB
 * 
 * Usage: npx ts-node src/scripts/migrate-images-to-db.ts
 * 
 * Reads existing files referenced by users/notifications and stores them as base64 in the Media table.
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
}

const db = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

const uploadsDir = path.join(__dirname, '../../uploads');

async function migrateImages() {
    console.log('🚀 Migrating existing file images to Media table in DB\n');

    await db.authenticate();
    console.log('✅ Connected to Neon PostgreSQL');

    // Ensure media table exists
    await db.query(`
    CREATE TABLE IF NOT EXISTS "media" (
      "id" SERIAL PRIMARY KEY,
      "data" TEXT NOT NULL,
      "mimeType" VARCHAR(50) NOT NULL,
      "filename" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
    console.log('✅ Media table ready');

    // Get all users with profile pictures
    const [users]: any = await db.query('SELECT id, "profilePicture" FROM users WHERE "profilePicture" IS NOT NULL;');
    console.log(`\n📸 Users with profile pictures: ${users.length}`);

    for (const user of users) {
        if (user.profilePicture?.startsWith('media/')) {
            console.log(`   ⏭ User ${user.id}: already migrated`);
            continue;
        }

        // Try to find the file
        const filePath = path.join(uploadsDir, user.profilePicture.replace('uploads/', ''));
        if (fs.existsSync(filePath)) {
            try {
                const fileBuffer = fs.readFileSync(filePath);
                const ext = path.extname(filePath).toLowerCase();
                const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

                const [result]: any = await db.query(`
          INSERT INTO "media" ("data", "mimeType", "filename", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id;
        `, { bind: [fileBuffer.toString('base64'), mimeType, path.basename(filePath)] });

                const mediaId = result[0].id;
                await db.query(`UPDATE users SET "profilePicture" = $1 WHERE id = $2;`, { bind: [`media/${mediaId}`, user.id] });
                console.log(`   ✅ User ${user.id}: migrated to media/${mediaId}`);
            } catch (err: any) {
                console.error(`   ❌ User ${user.id}: ${err.message}`);
            }
        } else {
            console.log(`   ⚠️ User ${user.id}: file not found (${filePath})`);
        }
    }

    // Get all notifications with images
    const [notifications]: any = await db.query('SELECT id, "imagePath", "thumbnailPath" FROM notifications WHERE "imagePath" IS NOT NULL OR "thumbnailPath" IS NOT NULL;');
    console.log(`\n🖼️  Notifications with images: ${notifications.length}`);

    for (const notif of notifications) {
        // Migrate imagePath
        if (notif.imagePath && !notif.imagePath.startsWith('media/')) {
            const filePath = path.join(uploadsDir, notif.imagePath);
            if (fs.existsSync(filePath)) {
                try {
                    const fileBuffer = fs.readFileSync(filePath);
                    const ext = path.extname(filePath).toLowerCase();
                    const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

                    const [result]: any = await db.query(`
            INSERT INTO "media" ("data", "mimeType", "filename", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id;
          `, { bind: [fileBuffer.toString('base64'), mimeType, path.basename(filePath)] });

                    const mediaId = result[0].id;
                    await db.query(`UPDATE notifications SET "imagePath" = $1 WHERE id = $2;`, { bind: [`media/${mediaId}`, notif.id] });
                    console.log(`   ✅ Notification ${notif.id} image: migrated to media/${mediaId}`);
                } catch (err: any) {
                    console.error(`   ❌ Notification ${notif.id} image: ${err.message}`);
                }
            } else {
                console.log(`   ⚠️ Notification ${notif.id} image: file not found`);
            }
        }

        // Migrate thumbnailPath
        if (notif.thumbnailPath && !notif.thumbnailPath.startsWith('media/')) {
            const filePath = path.join(uploadsDir, notif.thumbnailPath);
            if (fs.existsSync(filePath)) {
                try {
                    const fileBuffer = fs.readFileSync(filePath);
                    const [result]: any = await db.query(`
            INSERT INTO "media" ("data", "mimeType", "filename", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id;
          `, { bind: [fileBuffer.toString('base64'), 'image/jpeg', path.basename(filePath)] });

                    const mediaId = result[0].id;
                    await db.query(`UPDATE notifications SET "thumbnailPath" = $1 WHERE id = $2;`, { bind: [`media/${mediaId}`, notif.id] });
                    console.log(`   ✅ Notification ${notif.id} thumbnail: migrated to media/${mediaId}`);
                } catch (err: any) {
                    console.error(`   ❌ Notification ${notif.id} thumbnail: ${err.message}`);
                }
            } else {
                console.log(`   ⚠️ Notification ${notif.id} thumbnail: file not found`);
            }
        }
    }

    console.log('\n🎉 Image migration complete!');
    await db.close();
    process.exit(0);
}

migrateImages().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
