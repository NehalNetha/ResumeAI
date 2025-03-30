import { createClient } from '@/utils/supabase/server';

export interface CreditTransaction {
  amount: number;
  description: string;
  transactionType: 'purchase' | 'usage' | 'refund' | 'bonus' | 'free';
  referenceId?: string;
}

export async function getUserCredits(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user credits:', error);
    return 0;
  }
  
  return data?.credits || 0;
}

export async function addCredits(userId: string, transaction: CreditTransaction) {
  const supabase = await createClient();
  
  // Start a transaction
  const { data: existingCredits, error: fetchError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching user credits:', fetchError);
    throw new Error('Failed to fetch user credits');
  }
  
  // Record the transaction in credits_history
  const { error: historyError } = await supabase
    .from('credits_history')
    .insert({
      user_id: userId,
      amount: transaction.amount,
      description: transaction.description,
      transaction_type: transaction.transactionType,
      reference_id: transaction.referenceId,
      created_at: new Date().toISOString()
    });
    
  if (historyError) {
    console.error('Error recording credit history:', historyError);
    throw new Error('Failed to record credit transaction');
  }
  
  if (existingCredits) {
    // Update existing credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits: existingCredits.credits + transaction.amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (updateError) {
      console.error('Error updating user credits:', updateError);
      throw new Error('Failed to update user credits');
    }
  } else {
    // Create new credits record
    const { error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        credits: transaction.amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error creating user credits:', insertError);
      throw new Error('Failed to create user credits');
    }
  }
  
  return true;
}

export async function useCredits(userId: string, amount: number, description: string, referenceId?: string) {
  if (amount <= 0) {
    throw new Error('Credit usage amount must be positive');
  }
  
  const supabase = await createClient();
  
  // Get current credits
  const { data: existingCredits, error: fetchError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching user credits:', fetchError);
    throw new Error('Failed to fetch user credits');
  }
  
  if (!existingCredits || existingCredits.credits < amount) {
    throw new Error('Insufficient credits');
  }
  
  // Record the usage in credits_history
  const { error: historyError } = await supabase
    .from('credits_history')
    .insert({
      user_id: userId,
      amount: -amount, // Negative amount for usage
      description,
      transaction_type: 'usage',
      reference_id: referenceId,
      created_at: new Date().toISOString()
    });
    
  if (historyError) {
    console.error('Error recording credit usage:', historyError);
    throw new Error('Failed to record credit usage');
  }
  
  // Update credits
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      credits: existingCredits.credits - amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (updateError) {
    console.error('Error updating user credits:', updateError);
    throw new Error('Failed to update user credits');
  }
  
  return true;
}

export async function getCreditHistory(userId: string, limit = 10, offset = 0) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('credits_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
  
  return data;
}