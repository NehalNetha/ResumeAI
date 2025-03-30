import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/server';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers(); // Add await here
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  // Handle the event
  const supabase = await createClient();
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Get the credits amount from the metadata
      const metadata = session.metadata || {};
      const creditsToAdd = parseInt(metadata.credits as string) || 0;
      const userId = metadata.userId as string || session.client_reference_id as string;
      const planId = metadata.planId as string || 'unknown';
      
      if (userId && creditsToAdd > 0) {
        // Check if user already has a credits record
        const { data: existingCredits } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (existingCredits) {
          // Update existing credits
          await supabase
            .from('user_credits')
            .update({
              credits: existingCredits.credits + creditsToAdd,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        } else {
          // Create new credits record
          await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              credits: creditsToAdd,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        
        // Record the transaction in credits_history
        await supabase
          .from('credits_history')
          .insert({
            user_id: userId,
            amount: creditsToAdd,
            description: `Purchased ${creditsToAdd} credits (${planId} plan)`,
            transaction_type: 'purchase',
            reference_id: session.id,
            created_at: new Date().toISOString()
          });
      }
      break;
    }
    
    case 'payment_intent.succeeded': {
      // Additional handling if needed
      break;
    }
    
    case 'payment_intent.payment_failed': {
      // Handle failed payments if needed
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};