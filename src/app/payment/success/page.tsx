"use client";

import React, { useEffect, useState, Suspense } from 'react'; // Import Suspense
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

// Define the main content component that uses useSearchParams
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const [totalCredits, setTotalCredits] = useState<number | null>(null);

  useEffect(() => {
    // Verify the payment was successful and get credit information
    const verifyPayment = async () => {
      // Reset state on re-run/sessionId change
      setIsLoading(true);
      setError(null);
      setCreditsAdded(null);
      setTotalCredits(null);
      
      try {
        if (!sessionId) {
          setError('No session ID found in URL');
          setIsLoading(false);
          return;
        }

        // Get the user's current credits
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setError('User not authenticated');
          setIsLoading(false);
          return;
        }
        
        // Get the latest credit transaction for this session
        const { data: transactions, error: transactionError } = await supabase
          .from('credits_history')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('reference_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (transactionError) {
          console.error('Error fetching transaction:', transactionError);
          setError(`Error fetching transaction: ${transactionError.message}`);
          setIsLoading(false);
          return;
        }
          
        if (transactions && transactions.length > 0) {
          setCreditsAdded(Math.abs(transactions[0].amount));
        } else {
           // Handle case where transaction might not be found (e.g., webhook delay, wrong session ID)
           setError('Could not find transaction details for this session. It might take a moment to process.');
           setIsLoading(false);
           return;
        }
        
        // Get total credits
        const { data: userCredits, error: creditsError } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', session.user.id)
          .single();

        if (creditsError) {
           console.error('Error fetching user credits:', creditsError);
           // Don't block success, but maybe log or show a partial success?
           // setError(`Could not fetch total credits: ${creditsError.message}`);
        } else if (userCredits) {
          setTotalCredits(userCredits.credits);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(err instanceof Error ? `Failed to verify payment: ${err.message}` : 'Failed to verify payment due to an unknown error.');
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]); // Dependency array ensures this runs when sessionId changes

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-red-100 p-6 rounded-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Payment Verification Issue</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-green-50 p-8 rounded-lg text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h1>
        
        {creditsAdded !== null && ( // Explicitly check for null
          <div className="bg-white p-4 rounded-lg mb-6 mt-4">
            <div className="flex items-center justify-center mb-2">
              <Coins size={24} className="text-yellow-500 mr-2" />
              <span className="text-2xl font-bold text-gray-800">+{creditsAdded}</span>
            </div>
            <p className="text-gray-600">Credits added to your account</p>
            
            {totalCredits !== null && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-gray-600">Total balance: <span className="font-semibold">{totalCredits} credits</span></p>
              </div>
            )}
          </div>
        )}
        
        <p className="text-gray-700 mb-6">
          Thank you for your purchase. Your credits have been added to your account and are ready to use.
        </p>
        
        <div className="space-y-2 flex flex-col ">
          <Link href="/dashboard">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/support">
            <Button variant="outline" className="w-full">Need Help?</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Define the loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Loading Payment Status...</p>
    </div>
  );
}

// Modify the default export to wrap PaymentSuccessContent in Suspense
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}