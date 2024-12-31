import { Router } from 'express';
import { Request, Response } from 'express';
import Beat from '../models/Beat';

const router = Router();

// Récupérer tous les beats (avec pagination)
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const beats = await Beat.find()
            .skip(skip)
            .limit(limit)
            .populate('producer', 'username');

        const total = await Beat.countDocuments();

        res.json({
            beats,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching beats' });
    }
});

// Rechercher des beats par genre
router.get('/search/genre/:genre', async (req: Request, res: Response) => {
    try {
        const { genre } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const beats = await Beat.find({ genre: genre })
            .skip(skip)
            .limit(limit)
            .populate('producer', 'username');

        const total = await Beat.countDocuments({ genre: genre });

        res.json({
            beats,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: 'Error searching beats by genre' });
    }
});

// Récupérer un beat spécifique
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const beat = await Beat.findById(req.params.id).populate('producer', 'username');
        if (!beat) {
            return res.status(404).json({ error: 'Beat not found' });
        }
        res.json(beat);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching beat' });
    }
});

// Créer un nouveau beat
router.post('/', async (req: Request, res: Response) => {
    try {
        const beat = new Beat(req.body);
        await beat.save();
        res.status(201).json(beat);
    } catch (error) {
        res.status(400).json({ error: 'Error creating beat' });
    }
});

// Mettre à jour un beat
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const beat = await Beat.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!beat) {
            return res.status(404).json({ error: 'Beat not found' });
        }
        res.json(beat);
    } catch (error) {
        res.status(400).json({ error: 'Error updating beat' });
    }
});

// Supprimer un beat
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const beat = await Beat.findByIdAndDelete(req.params.id);
        if (!beat) {
            return res.status(404).json({ error: 'Beat not found' });
        }
        res.json({ message: 'Beat deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting beat' });
    }
});

// Rechercher des beats
router.get('/search', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const beats = await Beat.find()
            .skip(skip)
            .limit(limit)
            .populate('producer', 'username');

        const total = await Beat.countDocuments();

        res.json({
            beats,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: 'Error searching beats' });
    }
});

export default router;
