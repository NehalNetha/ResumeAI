import { createClient } from '@/utils/supabase/client';

export async function getUserCredits() {
  const supabase = createClient();
  
  // Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return 0;
  }
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', session.user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user credits:', error);
    return 0;
  }
  
  return data?.credits || 0;
}

export async function getCreditHistory(limit = 10, offset = 0) {
  const supabase = createClient();
  
  // Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('credits_history')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
  
  return data;
}