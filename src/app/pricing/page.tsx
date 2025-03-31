 "use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

interface PricingPlan {
  id: string;
  priceId: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  credits: number;
  popular?: boolean;
}

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Define pricing plans with Stripe price IDs
  const pricingPlans: PricingPlan[] = [
    {
      id: 'basic',
      priceId: 'price_1XXXXXXXXXXXXXXXXXXXXXXXX', // Replace with your actual Stripe price ID
      name: 'Basic',
      price: 9.99,
      description: 'Get started with the essential tools',
      features: [
        '50 credits',
        'Access to basic templates',
        'PDF downloads',
        'Basic AI customization'
      ],
      credits: 50
    },
    {
      id: 'pro',
      priceId: 'price_1XXXXXXXXXXXXXXXXXXXXXXXX', // Replace with your actual Stripe price ID
      name: 'Professional',
      price: 19.99,
      description: 'Perfect for active job seekers',
      features: [
        '125 credits',
        'All premium templates',
        'Advanced AI customization',
        'Resume storage & versioning',
        'Priority support'
      ],
      credits: 125,
      popular: true
    },
    {
      id: 'enterprise',
      priceId: 'price_1XXXXXXXXXXXXXXXXXXXXXXXX', // Replace with your actual Stripe price ID
      name: 'Enterprise',
      price: 49.99,
      description: 'For power users and career services',
      features: [
        '350 credits',
        'All Professional features',
        'Unlimited resume versions',
        'Advanced analytics',
        'Cover letter generation',
        'Interview preparation assistance'
      ],
      credits: 350
    }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    fetchUser();
  }, []);

  const handleCheckout = async (plan: PricingPlan) => {
    if (!user) {
      toast("Please log in to purchase credits");
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    
    setLoadingPlan(plan.id);
    
    try {
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
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Invest in your career with our professional resume building tools
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
  {pricingPlans.map((plan) => (
    <Card 
      key={plan.id} 
      className={`flex flex-col h-full ${plan.popular ? 'border-blue-500 border-2 shadow-lg relative' : ''}`}
    >
      {plan.popular && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 px-2 rounded-t-lg font-medium">
          Most Popular
        </div>
      )}
      <CardHeader className={`${plan.popular ? 'pt-10' : ''}`}>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-gray-500 ml-1">one-time</span>
        </div>
        
        <div className="text-sm bg-blue-50 text-blue-600 font-medium px-3 py-2 rounded-md flex items-center mb-6">
          <CreditCard className="h-4 w-4 mr-2" />
          {plan.credits} credits included
        </div>
        
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        <Button 
          className="w-full py-5"
          onClick={() => handleCheckout(plan)}
          disabled={loadingPlan === plan.id}
          variant={plan.popular ? "default" : "outline"}
        >
          {loadingPlan === plan.id ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processing...
            </>
          ) : (
            'Get Started'
          )}
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
        
        <div className="mt-16 bg-white rounded-lg shadow-sm border p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">How Credits Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Purchase Credits</h3>
              <p className="text-gray-600 text-sm">
                Choose a plan that fits your needs and make a one-time purchase.
              </p>
            </div>
            
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Use Your Credits</h3>
              <p className="text-gray-600 text-sm">
                Each resume generation costs 5 credits. Use them anytime - they never expire.
              </p>
            </div>
            
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Top Up When Needed</h3>
              <p className="text-gray-600 text-sm">
                Running low? Purchase more credits anytime at the same great rates.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-2">What can I do with credits?</h3>
            <p className="text-gray-600">
              Credits are used for AI-powered resume generations and customizations. Each resume generation costs 5 credits. The more complex the customization, the more value you get from each credit spent.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-2">Do credits expire?</h3>
            <p className="text-gray-600">
              No, your credits never expire. Use them at your own pace whenever you need to update your resume or create a new one.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-2">Can I get a refund?</h3>
            <p className="text-gray-600">
              We offer a 7-day money-back guarantee if you're not satisfied with our service. Contact our support team for assistance with refunds.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-2">How secure is my payment?</h3>
            <p className="text-gray-600">
              All payments are processed securely through Stripe, a PCI-compliant payment processor. We never store your payment information on our servers.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}