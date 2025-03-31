"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const supabase = createClient();
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setIsSubmitted(true);
      toast.success("Password reset link sent to your email");
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || "Failed to send reset password link");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout 
      title="Reset your password" 
      description="Enter your email address and we'll send you a link to reset your password"
    >
      {isSubmitted ? (
        <div className="text-center space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-md">
            <p>We've sent a password reset link to your email address.</p>
            <p className="mt-2">Please check your inbox and follow the instructions.</p>
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/login">Return to login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4 w-full">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
      
      <p className="text-sm text-gray-500 text-center mt-6">
        Remember your password?{" "}
        <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}