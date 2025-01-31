import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

interface WebhookError extends Error {
  code?: string;
  status?: number;
}

async function syncUser(
  id: string, 
  email: string, 
  firstName?: string | null, 
  lastName?: string | null,
  imageUrl?: string | null
) {
  const name = [firstName, lastName].filter(Boolean).join(' ') || null;
  
  await prisma.user.upsert({
    where: { id },
    create: {
      id,
      email,
      name,
      image: imageUrl,
    },
    update: {
      email,
      name,
      image: imageUrl,
    },
  });
}

async function handleUserDeleted(userId: string) {
  try {
    // Delete user and all related data will be deleted via cascade
    await prisma.user.delete({
      where: { id: userId },
    });
    console.log(`User ${userId} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
}

async function logWebhookEvent(eventType: string, userId: string, details: any) {
  try {
    await prisma.documentActivity.create({
      data: {
        documentId: 'system', // Special ID for system events
        userId,
        action: 'webhook_event',
        details: {
          eventType,
          ...details,
        },
      },
    });
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    const error: WebhookError = new Error('Missing WEBHOOK_SECRET environment variable');
    error.status = 500;
    throw error;
  }

  try {
    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // Validate headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing required Svix headers', { status: 400 });
    }

    // Get and validate the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance and verify the webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response('Invalid webhook signature', { status: 401 });
    }

    const { type: eventType, data } = evt;

    // Log the webhook event
    if (data.id) {
      await logWebhookEvent(eventType, data.id, data);
    }

    // Handle different event types
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          return new Response('No email found in user data', { status: 400 });
        }

        await syncUser(id, email, first_name, last_name, image_url);
        console.log(`User ${id} synced successfully for event ${eventType}`);
        break;
      }

      case 'user.deleted': {
        const { id } = data;
        await handleUserDeleted(id);
        break;
      }

      // Add more event types as needed
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ 
      success: true,
      event: eventType,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    const status = (error as WebhookError).status || 500;
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        details: (error as Error).message 
      }),
      { status }
    );
  }
} 