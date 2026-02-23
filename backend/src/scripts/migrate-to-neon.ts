// @ts-nocheck
/**
 * Migration Script: SQLite → Neon PostgreSQL
 * 
 * Usage: npx ts-node src/scripts/migrate-to-neon.ts
 * 
 * This script reads all data from the local SQLite database
 * and seeds it into the Neon PostgreSQL database.
 * 
 * Requirements:
 * - DATABASE_URL must be set in .env with your Neon connection string
 * - The local database.sqlite file must exist
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// dotenv resolves relative to CWD (backend/) when running via npm script
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
}

// Connect to local SQLite
const sqliteDb = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

// Connect to Neon PostgreSQL
const neonDb = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

async function migrate() {
    console.log('🚀 Starting SQLite → Neon PostgreSQL Migration\n');

    // Step 1: Test connections
    try {
        await sqliteDb.authenticate();
        console.log('✅ Connected to SQLite');
    } catch (error) {
        console.error('❌ Cannot connect to SQLite:', error);
        process.exit(1);
    }

    try {
        await neonDb.authenticate();
        console.log('✅ Connected to Neon PostgreSQL');
    } catch (error) {
        console.error('❌ Cannot connect to Neon:', error);
        process.exit(1);
    }

    // Step 2: Read all data from SQLite
    console.log('\n📖 Reading data from SQLite...');

    const [users]: any = await sqliteDb.query('SELECT * FROM users;');
    console.log(`   Users: ${users.length}`);

    const [notifications]: any = await sqliteDb.query('SELECT * FROM notifications;');
    console.log(`   Notifications: ${notifications.length}`);

    const [messages]: any = await sqliteDb.query('SELECT * FROM messages;');
    console.log(`   Messages: ${messages.length}`);

    const [classes]: any = await sqliteDb.query('SELECT * FROM classes;');
    console.log(`   Classes: ${classes.length}`);

    // Step 3: Create tables in Neon
    console.log('\n🏗️  Creating tables in Neon...');

    // Create ENUM types first (PostgreSQL requires this)
    try {
        await neonDb.query(`DO $$ BEGIN
      CREATE TYPE "enum_users_role" AS ENUM ('admin', 'teacher', 'student');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;`);

        await neonDb.query(`DO $$ BEGIN
      CREATE TYPE "enum_notifications_type" AS ENUM ('info', 'event', 'emergency', 'success', 'warning');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;`);
        console.log('   ✅ ENUM types created');
    } catch (error: any) {
        console.log('   ⚠️  ENUM types may already exist:', error.message);
    }

    // Create tables
    await neonDb.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "username" VARCHAR(80) NOT NULL UNIQUE,
      "email" VARCHAR(120) NOT NULL UNIQUE,
      "phone" VARCHAR(13) NOT NULL,
      "password" VARCHAR(255) NOT NULL,
      "role" "enum_users_role" NOT NULL DEFAULT 'student',
      "profilePicture" VARCHAR(200),
      "onlineStatus" BOOLEAN NOT NULL DEFAULT false,
      "lastActive" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "department" VARCHAR(100),
      "course" VARCHAR(100),
      "yearLevel" INTEGER,
      "bio" TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
    console.log('   ✅ Users table created');

    await neonDb.query(`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" SERIAL PRIMARY KEY,
      "title" VARCHAR(100) NOT NULL,
      "content" TEXT NOT NULL,
      "type" "enum_notifications_type" NOT NULL DEFAULT 'info',
      "imagePath" VARCHAR(200),
      "thumbnailPath" VARCHAR(200),
      "eventDate" TIMESTAMP WITH TIME ZONE,
      "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
    console.log('   ✅ Notifications table created');

    await neonDb.query(`
    CREATE TABLE IF NOT EXISTS "messages" (
      "id" SERIAL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "senderId" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "recipientId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "isBroadcast" BOOLEAN NOT NULL DEFAULT false,
      "readStatus" BOOLEAN NOT NULL DEFAULT false,
      "readTimestamp" TIMESTAMP WITH TIME ZONE,
      "attachmentPath" VARCHAR(200),
      "attachmentType" VARCHAR(50),
      "deletedFor" TEXT,
      "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
    console.log('   ✅ Messages table created');

    await neonDb.query(`
    CREATE TABLE IF NOT EXISTS "classes" (
      "id" SERIAL PRIMARY KEY,
      "className" VARCHAR(100) NOT NULL,
      "subject" VARCHAR(100) NOT NULL,
      "description" TEXT,
      "teacherId" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "schedule" VARCHAR(200) NOT NULL,
      "room" VARCHAR(50),
      "semester" VARCHAR(50) NOT NULL,
      "academicYear" VARCHAR(50) NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
    console.log('   ✅ Classes table created');

    // Step 4: Insert data (users first due to foreign keys)
    console.log('\n📥 Inserting data into Neon...');

    // Clear existing data (in reverse dependency order)
    await neonDb.query('DELETE FROM "classes";');
    await neonDb.query('DELETE FROM "messages";');
    await neonDb.query('DELETE FROM "notifications";');
    await neonDb.query('DELETE FROM "users";');
    console.log('   Cleared existing Neon data');

    // Insert users
    let userCount = 0;
    for (const user of users) {
        try {
            await neonDb.query(`
        INSERT INTO "users" ("id", "username", "email", "phone", "password", "role", 
          "profilePicture", "onlineStatus", "lastActive", "department", "course", 
          "yearLevel", "bio", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT ("id") DO NOTHING;
      `, {
                bind: [
                    user.id, user.username, user.email, user.phone, user.password, user.role,
                    user.profilePicture || null, user.onlineStatus ? true : false,
                    user.lastActive || new Date().toISOString(),
                    user.department || null, user.course || null, user.yearLevel || null,
                    user.bio || null,
                    user.createdAt || new Date().toISOString(),
                    user.updatedAt || new Date().toISOString()
                ]
            });
            userCount++;
        } catch (error: any) {
            console.error(`   ⚠️  Failed to insert user ${user.username}:`, error.message);
        }
    }
    console.log(`   ✅ Users inserted: ${userCount}/${users.length}`);

    // Reset user ID sequence to avoid conflicts with future inserts
    if (users.length > 0) {
        const maxId = Math.max(...users.map((u: any) => u.id));
        await neonDb.query(`SELECT setval('"users_id_seq"', $1, true);`, { bind: [maxId] });
        console.log(`   ✅ User ID sequence set to ${maxId}`);
    }

    // Insert notifications
    let notifCount = 0;
    for (const notif of notifications) {
        try {
            await neonDb.query(`
        INSERT INTO "notifications" ("id", "title", "content", "type", "imagePath", 
          "thumbnailPath", "eventDate", "timestamp", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT ("id") DO NOTHING;
      `, {
                bind: [
                    notif.id, notif.title, notif.content, notif.type,
                    notif.imagePath || null, notif.thumbnailPath || null,
                    notif.eventDate || null,
                    notif.timestamp || new Date().toISOString(),
                    notif.createdAt || new Date().toISOString(),
                    notif.updatedAt || new Date().toISOString()
                ]
            });
            notifCount++;
        } catch (error: any) {
            console.error(`   ⚠️  Failed to insert notification ${notif.id}:`, error.message);
        }
    }
    console.log(`   ✅ Notifications inserted: ${notifCount}/${notifications.length}`);

    if (notifications.length > 0) {
        const maxId = Math.max(...notifications.map((n: any) => n.id));
        await neonDb.query(`SELECT setval('"notifications_id_seq"', $1, true);`, { bind: [maxId] });
    }

    // Insert messages
    let msgCount = 0;
    for (const msg of messages) {
        try {
            await neonDb.query(`
        INSERT INTO "messages" ("id", "content", "senderId", "recipientId", "isBroadcast", 
          "readStatus", "readTimestamp", "attachmentPath", "attachmentType", 
          "deletedFor", "timestamp", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT ("id") DO NOTHING;
      `, {
                bind: [
                    msg.id, msg.content, msg.senderId, msg.recipientId || null,
                    msg.isBroadcast ? true : false, msg.readStatus ? true : false,
                    msg.readTimestamp || null,
                    msg.attachmentPath || null, msg.attachmentType || null,
                    msg.deletedFor || null,
                    msg.timestamp || new Date().toISOString(),
                    msg.createdAt || new Date().toISOString(),
                    msg.updatedAt || new Date().toISOString()
                ]
            });
            msgCount++;
        } catch (error: any) {
            console.error(`   ⚠️  Failed to insert message ${msg.id}:`, error.message);
        }
    }
    console.log(`   ✅ Messages inserted: ${msgCount}/${messages.length}`);

    if (messages.length > 0) {
        const maxId = Math.max(...messages.map((m: any) => m.id));
        await neonDb.query(`SELECT setval('"messages_id_seq"', $1, true);`, { bind: [maxId] });
    }

    // Insert classes
    let classCount = 0;
    for (const cls of classes) {
        try {
            await neonDb.query(`
        INSERT INTO "classes" ("id", "className", "subject", "description", "teacherId", 
          "schedule", "room", "semester", "academicYear", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT ("id") DO NOTHING;
      `, {
                bind: [
                    cls.id, cls.className, cls.subject, cls.description || null,
                    cls.teacherId, cls.schedule, cls.room || null,
                    cls.semester, cls.academicYear, cls.isActive ? true : false,
                    cls.createdAt || new Date().toISOString(),
                    cls.updatedAt || new Date().toISOString()
                ]
            });
            classCount++;
        } catch (error: any) {
            console.error(`   ⚠️  Failed to insert class ${cls.id}:`, error.message);
        }
    }
    console.log(`   ✅ Classes inserted: ${classCount}/${classes.length}`);

    if (classes.length > 0) {
        const maxId = Math.max(...classes.map((c: any) => c.id));
        await neonDb.query(`SELECT setval('"classes_id_seq"', $1, true);`, { bind: [maxId] });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`   Users:         ${userCount}/${users.length}`);
    console.log(`   Notifications: ${notifCount}/${notifications.length}`);
    console.log(`   Messages:      ${msgCount}/${messages.length}`);
    console.log(`   Classes:       ${classCount}/${classes.length}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Update .env: set DB_TYPE=postgres');
    console.log('   2. Run: npm run dev');
    console.log('   3. Test your app!');

    await sqliteDb.close();
    await neonDb.close();
    process.exit(0);
}

migrate().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
