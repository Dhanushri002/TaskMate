import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { tasks, users } from '@/models/schema';
import { eq, and, desc, or, like } from 'drizzle-orm';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().int().positive().optional().nullable(),
  aiGenerated: z.boolean().optional(),
  aiCategory: z.string().optional().nullable(),
});

// GET all tasks
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search');

    const conditions = [];

    // Role-based filtering
    if (user.role === 'member') {
      conditions.push(
        or(
          eq(tasks.creatorId, user.id),
          eq(tasks.assigneeId, user.id)
        )
      );
    }

    if (status) conditions.push(eq(tasks.status, status as any));
    if (priority) conditions.push(eq(tasks.priority, priority as any));
    if (projectId) conditions.push(eq(tasks.projectId, projectId));
    if (search) conditions.push(like(tasks.title, `%${search}%`));

    const allTasks = await db.query.tasks.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        creator: true,
        assignee: true,
        project: true,
        comments: {
          with: {
            user: true,
          },
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
      },
      orderBy: [desc(tasks.createdAt)],
    });

    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create task
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    const [newTask] = await db
      .insert(tasks)
      .values({
        ...validatedData,
        creatorId: user.id,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      })
      .returning();

    const taskWithRelations = await db.query.tasks.findFirst({
      where: eq(tasks.id, newTask.id),
      with: {
        creator: true,
        assignee: true,
        project: true,
      },
    });

    return NextResponse.json(taskWithRelations, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}