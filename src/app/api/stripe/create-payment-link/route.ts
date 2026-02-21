import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    // Fetch invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, projects(*)')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create a Stripe Payment Link via a product + price
    const product = await stripe.products.create({
      name: `Invoice - ${invoice.projects.title}`,
      metadata: {
        invoice_id: invoiceId,
        project_id: invoice.project_id,
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: invoice.amount,
      currency: invoice.currency || 'usd',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        invoice_id: invoiceId,
        project_id: invoice.project_id,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/p/${invoice.projects.slug}`,
        },
      },
    });

    // Update invoice with payment link
    await supabase
      .from('invoices')
      .update({ stripe_payment_link: paymentLink.url, status: 'sent' })
      .eq('id', invoiceId);

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Payment link error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
