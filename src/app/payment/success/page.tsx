"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const [totalCredits, setTotalCredits] = useState<number | null>(null);

  useEffect(() => {
    // Verify the payment was successful and get credit information
    const verifyPayment = async () => {
      try {
        if (!sessionId) {
          setError('No session ID found');
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
        const { data: transactions } = await supabase
          .from('credits_history')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('reference_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (transactions && transactions.length > 0) {
          setCreditsAdded(Math.abs(transactions[0].amount));
        }
        
        // Get total credits
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', session.user.id)
          .single();
          
        if (userCredits) {
          setTotalCredits(userCredits.credits);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment');
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

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
          <h1 className="text-2xl font-bold text-red-700 mb-4">Payment Verification Failed</h1>
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
        
        {creditsAdded && (
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
        
        <div className="space-y-3">
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