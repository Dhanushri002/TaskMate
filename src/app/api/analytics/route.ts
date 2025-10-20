import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { tasks, users } from '@/models/schema';
import { eq, and, lt, gte, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only managers and admins can view analytics
    if (user.role === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all tasks
    const allTasks = await db.query.tasks.findMany();

    // Calculate metrics
    const totalTasks = allTasks.length;

    const tasksByStatus = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };

    const tasksByPriority = {
      low: allTasks.filter(t => t.priority === 'low').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      urgent: allTasks.filter(t => t.priority === 'urgent').length,
    };

    const completedTasks = tasksByStatus.completed;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const now = new Date();
    const overdueTasks = allTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    ).length;

    // Tasks created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTasks = allTasks.filter(
      t => new Date(t.createdAt) >= thirtyDaysAgo
    ).length;

    // AI-generated tasks
    const aiGeneratedTasks = allTasks.filter(t => t.aiGenerated).length;

    return NextResponse.json({
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      completionRate,
      overdueTasks,
      recentTasks,
      aiGeneratedTasks,
      averageEstimatedHours: allTasks
        .filter(t => t.estimatedHours)
        .reduce((sum, t) => sum + (t.estimatedHours || 0), 0) / 
        (allTasks.filter(t => t.estimatedHours).length || 1),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}