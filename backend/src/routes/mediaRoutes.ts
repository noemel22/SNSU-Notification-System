import { Router, Request, Response } from 'express';
import Media from '../models/Media';

const router = Router();

// Serve media by ID — no auth required so images load in <img> tags
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const media = await Media.findByPk(req.params.id);

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Convert base64 back to buffer
        const buffer = Buffer.from(media.data, 'base64');

        // Set headers for proper image display and caching
        res.set({
            'Content-Type': media.mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=86400', // Cache for 24h
            'ETag': `"media-${media.id}"`
        });

        res.send(buffer);
    } catch (error) {
        console.error('Media serve error:', error);
        res.status(500).json({ error: 'Error serving media' });
    }
});

export default router;
