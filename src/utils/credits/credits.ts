import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

const supabase = createClient();

/**
 * Fetches the current credit balance for a user
 * @param userId The ID of the user
 * @returns The number of credits the user has
 */
export const fetchUserCredits = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user credits:', error);
      toast.error("Failed to load credit information");
      return 0;
    } 
    
    return data?.credits || 0;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return 0;
  }
};

/**
 * Updates a user's credit balance by deducting the specified amount
 * @param userId The ID of the user
 * @param amount The amount of credits to deduct
 * @param description Optional description of the transaction
 * @returns True if the update was successful, false otherwise
 */
export const updateUserCredits = async (
  userId: string, 
  amount: number, 
  description: string = 'Resume generation'
): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Get current credits first to ensure we have the latest value
    const currentCredits = await fetchUserCredits(userId);
    const newCredits = currentCredits - amount;
    
    // Update the credits in the database
    const { error } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    // Record the transaction in credits_history
    const { error: historyError } = await supabase
      .from('credits_history')
      .insert([{
        user_id: userId,
        amount: -amount, // Negative amount for consumption
        description,
        transaction_type: 'consumption'
      }]);
      
    if (historyError) {
      console.error('Error recording credit history:', historyError);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user credits:', error);
    toast.error("Failed to update credits");
    return false;
  }
};