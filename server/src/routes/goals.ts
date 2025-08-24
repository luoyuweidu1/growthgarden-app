import express from 'express';
import { prisma } from '../utils/database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { CreateGoalSchema, UpdateGoalSchema } from '../types/index.js';

const router = express.Router();

// Get all goals for authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user!.id },
      include: {
        actions: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            xpReward: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            actions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get single goal
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create new goal
router.post('/', authenticateToken, validateBody(CreateGoalSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const goal = await prisma.goal.create({
      data: {
        ...req.body,
        userId: req.user!.id,
      },
      include: {
        actions: true,
        _count: {
          select: {
            actions: true,
          },
        },
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.put('/:id', authenticateToken, validateBody(UpdateGoalSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            actions: true,
          },
        },
      },
    });

    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Water a goal (update lastWatered)
router.post('/:id/water', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { lastWatered: new Date() },
    });

    res.json({ 
      message: 'Goal watered successfully',
      lastWatered: updatedGoal.lastWatered 
    });
  } catch (error) {
    console.error('Water goal error:', error);
    res.status(500).json({ error: 'Failed to water goal' });
  }
});

// Add XP to goal
router.post('/:id/xp', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { amount } = req.body;
  
  if (!amount || amount < 1 || amount > 100) {
    return res.status(400).json({ error: 'XP amount must be between 1 and 100' });
  }

  try {
    const goal = await prisma.goal.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    let newXP = goal.currentXP + amount;
    let newLevel = goal.currentLevel;
    let newMaxXP = goal.maxXP;

    // Level up logic
    while (newXP >= newMaxXP) {
      newXP -= newMaxXP;
      newLevel += 1;
      newMaxXP = Math.floor(newMaxXP * 1.5); // Increase XP requirement by 50% each level
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        currentXP: newXP,
        currentLevel: newLevel,
        maxXP: newMaxXP,
      },
    });

    res.json({
      message: `Added ${amount} XP to goal`,
      leveledUp: newLevel > goal.currentLevel,
      previousLevel: goal.currentLevel,
      currentLevel: newLevel,
      currentXP: newXP,
      maxXP: newMaxXP,
    });
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({ error: 'Failed to add XP to goal' });
  }
});

// Delete goal
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;