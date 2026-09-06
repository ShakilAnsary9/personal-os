import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// Map a Stripe subscription status to a Personal OS plan.
function planFromStatus(status: string): 'pro' | 'free' {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free';
}

// Upsert a subscription row keyed by user_id, storing the Stripe ids.
async function applySubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sub: Stripe.Subscription,
) {
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan: planFromStatus(sub.status),
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
    stripe_subscription_id: sub.id,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  // Resolve user_id for the Stripe customer on this event.
  const customerId =
    (event.data.object as { customer?: string | null }).customer ?? null;
  const userId =
    (event.data.object as { metadata?: { user_id?: string } }).metadata
      ?.user_id ?? null;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.user_id;
      if (uid) {
        await supabase.from('subscriptions').upsert({
          user_id: uid,
          plan: 'pro',
          stripe_customer_id:
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id ?? null,
          stripe_subscription_id:
            (session.subscription as string) ?? null,
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      if (!userId && customerId) {
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (data) {
          await applySubscription(supabase, data.user_id, sub);
        }
      } else if (userId) {
        await applySubscription(supabase, userId, sub);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const key = userId ? userId : null;
      const query = key
        ? supabase
            .from('subscriptions')
            .update({ plan: 'free' })
            .eq('user_id', key)
        : supabase
            .from('subscriptions')
            .update({ plan: 'free' })
            .eq('stripe_subscription_id', sub.id);
      await query;
      break;
    }

    case 'invoice.payment_failed': {
      // Payment failed — downgrade to free so the Pro features lock.
      const invoice = event.data.object as Stripe.Invoice;
      const cid =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id ?? null;
      if (cid) {
        await supabase
          .from('subscriptions')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', cid);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
