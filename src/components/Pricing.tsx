"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from 'lucide-react';
import { getStripe } from '@/utils/stripe/client';
import { createClient } from '@/utils/supabase/client';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  features: string[];
  priceId: string;
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    credits: 50,
    description: 'Try out our basic features',
    features: [
      '50 free credits',
      'all templates',
      'Export as PDF',
    ],
    priceId: 'price_1RDf0wFMh96BYPjLj7NCjPIG', // No price ID for free plan
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 5.99,
    credits: 100,
    description: 'Perfect for active job seekers',
    features: [
      '100 credits',
      'All templates',
      'Reiterate on Resume using AI',
      'Priority support'
    ],
    priceId: 'price_1RDf0wFMh96BYPjLj7NCjPIG',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Beast Pack',
    price: 9.99,
    credits: 300,
    description: 'Best value',
    features: [
      '300',
      'All premium templates',
      'Reiterate infintie times ',
      'Priority support',
    ],
    priceId: 'price_1RDf1GFMh96BYPjLgpXMcLLO',
  }
];

const Pricing = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handlePurchaseCredits = async (plan: PricingPlan) => {
    try {
      setIsLoading(plan.id);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Redirect to login if not logged in
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect_to=${window.location.pathname}`,
          },
        });
        return;
      }
      
      // Free credits don't need Stripe checkout
      if (plan.id === 'starter') {
        // Handle free credits logic here
        // You might want to check if the user has already claimed free credits
        const { data: existingCredits } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (!existingCredits) {
          // Add free credits to the user's account
          await supabase
            .from('user_credits')
            .insert({
              user_id: session.user.id,
              credits: plan.credits,
              last_free_claim: new Date().toISOString()
            });
            
          // Redirect to dashboard or show success message
          window.location.href = '/dashboard';
        } else {
          // User has already claimed free credits
          alert('You have already claimed your free credits.');
        }
        return;
      }
      
      // Create checkout session for paid credit packs
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          metadata: {
            credits: plan.credits,
            planId: plan.id
          }
        }),
      });
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Error purchasing credits:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, Pay-As-You-Go Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Purchase credits and use them whenever you need. No monthly subscriptions or hidden fees.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.id === 'starter' ? (
                    <span className="text-gray-500"> one-time</span>
                  ) : (
                    <span className="text-gray-500"> for {plan.credits} credits</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check size={18} className="text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  onClick={() => handlePurchaseCredits(plan)}
                  disabled={isLoading === plan.id}
                >
                  {isLoading === plan.id ? 'Processing...' : plan.id === 'starter' ? 'Claim Free Credits' : 'Buy Credits'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">How Credits Work</h3>
          <div className="max-w-3xl mx-auto text-gray-600">
            <p>Credits are used for various actions in our platform:</p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li>• Creating a new resume: 5 credits</li>
              <li>• AI-powered resume optimization: 3 credits</li>
              <li>• Exporting to formats: 5 credit</li>
            </ul>
            <p className="mt-6">Credits never expire, so you can use them whenever you need!</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;