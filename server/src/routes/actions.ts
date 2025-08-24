import express from 'express';
import { prisma } from '../utils/database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { CreateActionSchema, UpdateActionSchema } from '../types/index.js';

const router = express.Router();

// Get all actions for authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { goalId, status, priority } = req.query;
    
    const where: any = { userId: req.user!.id };
    
    if (goalId) where.goalId = goalId as string;
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;

    const actions = await prisma.action.findMany({
      where,
      include: {
        goal: {
          select: {
            id: true,
            name: true,
            plantType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(actions);
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// Get single action
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const action = await prisma.action.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
      include: {
        goal: {
          select: {
            id: true,
            name: true,
            plantType: true,
          },
        },
      },
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    res.json(action);
  } catch (error) {
    console.error('Get action error:', error);
    res.status(500).json({ error: 'Failed to fetch action' });
  }
});

// Create new action
router.post('/', authenticateToken, validateBody(CreateActionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Verify the goal belongs to the user
    const goal = await prisma.goal.findFirst({
      where: {
        id: req.body.goalId,
        userId: req.user!.id,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const action = await prisma.action.create({
      data: {
        ...req.body,
        userId: req.user!.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      },
      include: {
        goal: {
          select: {
            id: true,
            name: true,
            plantType: true,
          },
        },
      },
    });

    res.status(201).json(action);
  } catch (error) {
    console.error('Create action error:', error);
    res.status(500).json({ error: 'Failed to create action' });
  }
});

// Update action
router.put('/:id', authenticateToken, validateBody(UpdateActionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const action = await prisma.action.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const updateData: any = { ...req.body };
    
    // Handle status change to completed
    if (req.body.status === 'completed' && action.status !== 'completed') {
      updateData.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed') {
      updateData.completedAt = null;
    }

    // Handle due date
    if (req.body.dueDate) {
      updateData.dueDate = new Date(req.body.dueDate);
    }

    const updatedAction = await prisma.action.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        goal: {
          select: {
            id: true,
            name: true,
            plantType: true,
          },
        },
      },
    });

    // If action was completed, add XP to the goal
    if (req.body.status === 'completed' && action.status !== 'completed') {
      const goal = await prisma.goal.findUnique({
        where: { id: action.goalId },
      });

      if (goal) {
        let newXP = goal.currentXP + action.xpReward;
        let newLevel = goal.currentLevel;
        let newMaxXP = goal.maxXP;

        // Level up logic
        while (newXP >= newMaxXP) {
          newXP -= newMaxXP;
          newLevel += 1;
          newMaxXP = Math.floor(newMaxXP * 1.5);
        }

        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            currentXP: newXP,
            currentLevel: newLevel,
            maxXP: newMaxXP,
          },
        });
      }
    }

    res.json(updatedAction);
  } catch (error) {
    console.error('Update action error:', error);
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// Delete action
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const action = await prisma.action.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    await prisma.action.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Action deleted successfully' });
  } catch (error) {
    console.error('Delete action error:', error);
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

export default router;