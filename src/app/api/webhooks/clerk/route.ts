import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      await db.insert(users).values({
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        avatar: image_url || null,
        role: 'member',
      });

      console.log('User created:', id);
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      await db
        .update(users)
        .set({
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          avatar: image_url || null,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, id));

      console.log('User updated:', id);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      await db.delete(users).where(eq(users.clerkId, id!));
      console.log('User deleted:', id);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  return new Response('', { status: 200 });
}