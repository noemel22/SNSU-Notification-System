// @ts-nocheck
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';

export const initializeChatHandlers = (io: SocketIOServer) => {
  // Middleware to authenticate socket connections
  io.use(async (socket: any, next: any) => {
    try {
      const token =
        socket.handshake?.auth?.token ||
        socket.handshake?.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as { id: number };

      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: any) => {
    console.log(`User connected: ${socket.userId}`);

    if (socket.userId && socket.user) {
      socket.join(`user_${socket.userId}`);
      socket.join(`role_${socket.user.role}`);

      await User.update(
        { onlineStatus: true, lastActive: new Date() },
        { where: { id: socket.userId } }
      );

      io.emit('user_status_change', {
        userId: socket.userId,
        status: 'online'
      });
    }

    socket.on('send_message', async (data: any) => {
      try {
        const { content, recipientId, isBroadcast } = data;

        if (!content || !socket.userId) {
          return socket.emit('error', { message: 'Invalid message data' });
        }

        const message = await Message.create({
          content,
          senderId: socket.userId,
          recipientId: isBroadcast ? null : recipientId,
          isBroadcast: isBroadcast || false
        });

        const fullMessage = await Message.findByPk(message.id, {
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'role', 'profilePicture', 'onlineStatus'] },
            { model: User, as: 'recipient', attributes: ['id', 'username', 'role', 'profilePicture', 'onlineStatus'] }
          ]
        });

        if (isBroadcast) {
          if (socket.user?.role === 'admin') {
            io.emit('new_message', fullMessage);
          } else if (socket.user?.role === 'teacher') {
            io.to('role_admin').emit('new_message', fullMessage);
            io.to('role_teacher').emit('new_message', fullMessage);
            io.to('role_student').emit('new_message', fullMessage);
          }
        } else {
          socket.emit('new_message', fullMessage);
          if (recipientId) {
            io.to(`user_${recipientId}`).emit('new_message', fullMessage);
          }
          io.to('role_admin').emit('new_message', fullMessage);
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data: any) => {
      const { recipientId } = data;
      if (recipientId && socket.userId) {
        io.to(`user_${recipientId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user?.username,
          typing: true
        });
      }
    });

    socket.on('stop_typing', (data: any) => {
      const { recipientId } = data;
      if (recipientId && socket.userId) {
        io.to(`user_${recipientId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user?.username,
          typing: false
        });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      if (socket.userId) {
        await User.update(
          { onlineStatus: false, lastActive: new Date() },
          { where: { id: socket.userId } }
        );

        io.emit('user_status_change', {
          userId: socket.userId,
          status: 'offline'
        });
      }
    });
  });
};
