import express from 'express';
import { prisma } from '../utils/database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { CreateHabitSchema, UpdateHabitSchema } from '../types/index.js';

const router = express.Router();

// Get daily habit for a specific date
router.get('/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const habit = await prisma.dailyHabit.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: new Date(date),
        },
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'No habit data found for this date' });
    }

    res.json(habit);
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ error: 'Failed to fetch habit data' });
  }
});

// Get habits for a date range
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = { userId: req.user!.id };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const habits = await prisma.dailyHabit.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Create new daily habit
router.post('/', authenticateToken, validateBody(CreateHabitSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { date, eatHealthy, exercise, sleepBefore11pm, notes } = req.body;

    // Check if habit already exists for this date
    const existingHabit = await prisma.dailyHabit.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: new Date(date),
        },
      },
    });

    if (existingHabit) {
      return res.status(409).json({ error: 'Habit already exists for this date. Use PATCH to update.' });
    }

    const habit = await prisma.dailyHabit.create({
      data: {
        userId: req.user!.id,
        date: new Date(date),
        eatHealthy,
        exercise,
        sleepBefore11pm,
        notes,
      },
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Update existing daily habit
router.patch('/:date', authenticateToken, validateBody(UpdateHabitSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { date } = req.params;
    const updateData = req.body;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const habit = await prisma.dailyHabit.upsert({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: new Date(date),
        },
      },
      update: updateData,
      create: {
        userId: req.user!.id,
        date: new Date(date),
        eatHealthy: updateData.eatHealthy || false,
        exercise: updateData.exercise || false,
        sleepBefore11pm: updateData.sleepBefore11pm || false,
        notes: updateData.notes,
      },
    });

    res.json(habit);
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete daily habit
router.delete('/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    await prisma.dailyHabit.delete({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: new Date(date),
        },
      },
    });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router; 