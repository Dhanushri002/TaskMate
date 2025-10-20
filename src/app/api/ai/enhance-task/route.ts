import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const enhanceSchema = z.object({
  title: z.string().min(1),
  briefDescription: z.string().optional(),
});

const taskEnhancementSchema = z.object({
  enhancedDescription: z.string(),
  suggestedCategory: z.string(),
  suggestedPriority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedHours: z.number(),
  suggestedDeadlineDays: z.number(),
  reasoning: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, briefDescription } = enhanceSchema.parse(body);

    const { object } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: taskEnhancementSchema,
      prompt: `You are a project management AI assistant. Enhance this task with professional details:

Title: ${title}
Brief Description: ${briefDescription || 'No additional context provided'}

Provide:
1. A detailed, actionable description (2-4 sentences) that clarifies the task scope and expected deliverables
2. Category (e.g., Development, Design, Testing, Documentation, DevOps, Research, Bug Fix, Feature)
3. Priority level based on common project patterns and urgency indicators in the title/description
4. Realistic time estimate in hours (consider complexity and typical task durations)
5. Suggested deadline in days from now (e.g., 3 means 3 days from today)
6. Brief reasoning for your priority and time estimate

Be specific, practical, and professional. Focus on clarity and actionability.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('AI enhancement error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to enhance task. Please try again.' },
      { status: 500 }
    );
  }
}