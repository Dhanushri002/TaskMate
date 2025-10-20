import { auth, currentUser } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const { userId: clerkId } = auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(role: 'admin' | 'manager') {
  const user = await requireAuth();
  
  if (user.role !== role && user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}

export async function canAccessTask(taskId: string) {
  const user = await requireAuth();
  
  const task = await db.query.tasks.findFirst({
    where: (tasks, { eq }) => eq(tasks.id, taskId),
  });

  if (!task) return false;

  // Admins and managers can access any task
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }

  // Members can only access tasks they created or are assigned to
  return task.creatorId === user.id || task.assigneeId === user.id;
}