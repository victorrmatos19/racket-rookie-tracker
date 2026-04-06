import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  if (!signature) {
    return new Response('Assinatura ausente', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Falha na validação da assinatura:', err);
    return new Response('Assinatura inválida', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const user_id = session.metadata?.user_id;
        const plan_id = session.metadata?.plan_id;

        if (!user_id || !plan_id) {
          console.error('[stripe-webhook] metadata incompleto', session.id);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        await supabase.from('subscriptions').upsert(
          {
            user_id,
            plan_id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            current_period_end: new Date(
              subscription.current_period_end * 1000,
            ).toISOString(),
          },
          { onConflict: 'user_id' },
        );
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const user_id = sub.metadata?.user_id;

        if (!user_id) {
          // Tenta buscar pelo stripe_subscription_id
          const { data } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .maybeSingle();

          if (!data) break;

          await supabase
            .from('subscriptions')
            .update({
              status: sub.status,
              plan_id: sub.metadata?.plan_id ?? undefined,
              trial_ends_at: sub.trial_end
                ? new Date(sub.trial_end * 1000).toISOString()
                : null,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', sub.id);
          break;
        }

        await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            trial_ends_at: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', user_id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription as string);
        break;
      }

      default:
        console.log(`[stripe-webhook] Evento ignorado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[stripe-webhook] Erro ao processar evento:', event.type, err);
    return new Response('Erro interno', { status: 500 });
  }
});
