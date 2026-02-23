import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
// @ts-ignore
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import sequelize from './database/config';
import { initializeChatHandlers } from './socket/chatHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import messageRoutes from './routes/messageRoutes';
import classRoutes from './routes/classRoutes';
import mediaRoutes from './routes/mediaRoutes';
import User from './models/User';
import Message from './models/Message';
import Notification from './models/Notification';
import Class from './models/Class';
import Media from './models/Media';

// Setup associations with cascade delete
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(Message, { foreignKey: 'recipientId', as: 'receivedMessages', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(Class, { foreignKey: 'teacherId', as: 'classes', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8100',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8100',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/media', mediaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

initializeChatHandlers(io);

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const isPostgres = (process.env.DB_TYPE || 'sqlite') === 'postgres';

    if (!isPostgres) {
      // Clean up any leftover backup tables from previous failed syncs (SQLite only)
      try {
        await sequelize.query('DROP TABLE IF EXISTS users_backup;');
        await sequelize.query('DROP TABLE IF EXISTS notifications_backup;');
        await sequelize.query('DROP TABLE IF EXISTS messages_backup;');
        await sequelize.query('DROP TABLE IF EXISTS classes_backup;');
        console.log('Cleaned up backup tables.');
      } catch (cleanError) {
        // Ignore cleanup errors
      }
    }

    // Sync models to database
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');

    // Add missing columns safely (works for both SQLite and PostgreSQL)
    const addColumnSafely = async (table: string, column: string, type: string) => {
      try {
        if (isPostgres) {
          await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type};`);
        } else {
          await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
        }
        console.log(`Ensured ${column} column exists on ${table} table.`);
      } catch (error: any) {
        // Column already exists (SQLite doesn't support IF NOT EXISTS for columns)
      }
    };

    await addColumnSafely('notifications', 'eventDate', 'TIMESTAMP DEFAULT NULL');
    await addColumnSafely('notifications', 'thumbnailPath', 'VARCHAR(255) DEFAULT NULL');
    await addColumnSafely('messages', 'deletedFor', 'TEXT DEFAULT NULL');

    // Create default admin account only if it doesn't exist
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@snsu.edu.ph',
        phone: '+639123456789',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default admin user created successfully.');
    }

    return true;
  } catch (error) {
    console.error('Unable to initialize database:', error);
    return false;
  }
};

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

initializeDatabase().then((success) => {
  if (success) {
    httpServer.listen(PORT as number, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${process.env.DB_TYPE || 'sqlite'}`);
    });
  } else {
    console.error('Failed to initialize database. Server not started.');
    process.exit(1);
  }
});

export { app, httpServer, io };
