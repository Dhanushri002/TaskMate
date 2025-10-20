import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { comments, users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  taskId: z.string().uuid(),
});

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
    const validatedData = commentSchema.parse(body);

    const [newComment] = await db
      .insert(comments)
      .values({
        content: validatedData.content,
        taskId: validatedData.taskId,
        userId: user.id,
      })
      .returning();

    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        user: true,
      },
    });

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}