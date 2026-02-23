import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import Media from '../models/Media';
import sharp from 'sharp';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.findAll({
      order: [['timestamp', 'DESC']]
    });

    res.json(notifications);
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Error fetching notifications', details: error.message });
  }
};

export const getNotificationById = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error: any) {
    console.error('Get notification by ID error:', error);
    res.status(500).json({ error: 'Error fetching notification', details: error.message });
  }
};

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, type, eventDate } = req.body;

    if (!title || !content || !type) {
      return res.status(400).json({ error: 'Title, content, and type are required' });
    }

    const existingNotification = await Notification.findOne({ where: { title } });
    if (existingNotification) {
      return res.status(400).json({ error: 'A notification with this title already exists' });
    }

    const notificationData: any = { title, content, type };

    if (eventDate) {
      notificationData.eventDate = new Date(eventDate);
    }

    // Handle image upload — store in DB as base64
    if (req.file) {
      // Process full-size image
      const imageBuffer = await sharp(req.file.buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      const imageMedia = await Media.create({
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
        filename: `notif-${Date.now()}.jpg`
      });

      // Process thumbnail
      const thumbBuffer = await sharp(req.file.buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const thumbMedia = await Media.create({
        data: thumbBuffer.toString('base64'),
        mimeType: 'image/jpeg',
        filename: `thumb-${Date.now()}.jpg`
      });

      notificationData.imagePath = `media/${imageMedia.id}`;
      notificationData.thumbnailPath = `media/${thumbMedia.id}`;
    }

    const notification = await Notification.create(notificationData);

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error: any) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: error.message || 'Error creating notification' });
  }
};

export const updateNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const { title, content, type, eventDate } = req.body;

    if (title) notification.title = title;
    if (content) notification.content = content;
    if (type) notification.type = type;
    if (eventDate !== undefined) {
      notification.eventDate = eventDate ? new Date(eventDate) : undefined;
    }

    // Handle new image upload
    if (req.file) {
      // Delete old media records if they exist
      if (notification.imagePath?.startsWith('media/')) {
        const oldImageId = notification.imagePath.split('/')[1];
        await Media.destroy({ where: { id: oldImageId } });
      }
      if (notification.thumbnailPath?.startsWith('media/')) {
        const oldThumbId = notification.thumbnailPath.split('/')[1];
        await Media.destroy({ where: { id: oldThumbId } });
      }

      // Process and save new image
      const imageBuffer = await sharp(req.file.buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      const imageMedia = await Media.create({
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
        filename: `notif-${Date.now()}.jpg`
      });

      const thumbBuffer = await sharp(req.file.buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const thumbMedia = await Media.create({
        data: thumbBuffer.toString('base64'),
        mimeType: 'image/jpeg',
        filename: `thumb-${Date.now()}.jpg`
      });

      notification.imagePath = `media/${imageMedia.id}`;
      notification.thumbnailPath = `media/${thumbMedia.id}`;
    }

    await notification.save();

    res.json({
      message: 'Notification updated successfully',
      notification
    });
  } catch (error: any) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Error updating notification', details: error.message });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Clean up media records
    if (notification.imagePath?.startsWith('media/')) {
      const imageId = notification.imagePath.split('/')[1];
      await Media.destroy({ where: { id: imageId } });
    }
    if (notification.thumbnailPath?.startsWith('media/')) {
      const thumbId = notification.thumbnailPath.split('/')[1];
      await Media.destroy({ where: { id: thumbId } });
    }

    await notification.destroy();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Error deleting notification', details: error.message });
  }
};
