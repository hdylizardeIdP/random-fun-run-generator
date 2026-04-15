import { Router, Request, Response } from 'express';
import { generateLoopRoute, generatePointToPointRoute } from '../services/openRouteService';

const router = Router();

interface GenerateBody {
  start: [number, number];
  end?: [number, number];
  distance: number;
  surface: 'road' | 'trail' | 'mixed';
  mode: 'random' | 'scenic';
}

router.post('/generate', async (req: Request<object, object, GenerateBody>, res: Response) => {
  try {
    const { start, end, distance, surface, mode } = req.body;

    if (!start || !Array.isArray(start) || start.length !== 2) {
      res.status(400).json({ message: 'Invalid start coordinates' });
      return;
    }

    if (distance <= 0 || distance > 50) {
      res.status(400).json({ message: 'Distance must be between 0 and 50 miles' });
      return;
    }

    const result =
      end && Array.isArray(end) && end.length === 2
        ? await generatePointToPointRoute(start, end, surface, mode)
        : await generateLoopRoute(start, distance, surface, mode);
    res.json(result);
  } catch (error) {
    console.error('Route generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate route';
    res.status(500).json({ message });
  }
});

export default router;
