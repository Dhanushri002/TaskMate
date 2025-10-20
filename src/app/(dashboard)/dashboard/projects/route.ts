import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { projects, users } from '@/models/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3b82f6'),
});

// GET all projects
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

    const allProjects = await db.query.projects.findMany({
      where: eq(projects.isArchived, false),
      with: {
        owner: true,
        tasks: {
          limit: 5,
          orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        },
      },
      orderBy: [desc(projects.createdAt)],
    });

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create project
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

    // Only managers and admins can create projects
    if (user.role === 'member') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    const [newProject] = await db
      .insert(projects)
      .values({
        ...validatedData,
        ownerId: user.id,
      })
      .returning();

    const projectWithRelations = await db.query.projects.findFirst({
      where: eq(projects.id, newProject.id),
      with: {
        owner: true,
      },
    });

    return NextResponse.json(projectWithRelations, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}