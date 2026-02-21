import { stripe } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Use service role key for webhook since there's no auth context
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Handle subscription checkout
      if (session.mode === 'subscription' && session.metadata?.supabase_user_id) {
        const subscriptionId = session.subscription as string;
        const plan = session.metadata.plan || 'pro';

        await supabase
          .from('users')
          .update({
            stripe_subscription_id: subscriptionId,
            plan,
          })
          .eq('id', session.metadata.supabase_user_id);
      }

      // Handle payment for invoice
      if (session.metadata?.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', session.metadata.invoice_id);

        await supabase.from('activities').insert({
          project_id: session.metadata.project_id,
          actor: 'client',
          action: 'paid',
          description: 'Invoice paid',
        });
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;

      if (paymentIntent.metadata?.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq('id', paymentIntent.metadata.invoice_id);

        await supabase.from('activities').insert({
          project_id: paymentIntent.metadata.project_id,
          actor: 'client',
          action: 'paid',
          description: 'Payment received',
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      // Downgrade to free plan
      await supabase
        .from('users')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
