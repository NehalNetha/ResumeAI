"use client"
import React, { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const supabase = createClient();

  // Handle email-based sign up
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear any previous errors

    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
      
      // Check if user already exists (Supabase returns data.user but sets identities to null)
      if (data?.user?.identities?.length === 0) {
        setErrorMessage("This email is already registered. Please log in instead.");
        return;
      }
      
      toast.success("Signup successful! Please check your email for verification.");
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        setErrorMessage("This email is already registered. Please log in instead.");
      } else {
        setErrorMessage(error.message || "Failed to sign up");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle GitHub OAuth sign up
  const handleGithubSignup = async () => {
    try {
      setIsGithubLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('GitHub signup error:', error);
      setErrorMessage(error.message || "Failed to sign up with GitHub");
      setIsGithubLoading(false);
    }
  };

  // Handle Google OAuth sign up
  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      setErrorMessage(error.message || "Failed to sign up with Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create an account" 
      description="Sign up to get started with ResumeAI"
    >
      {isSubmitted ? (
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {/* Simple check icon */}
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Check your email</h3>
          <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm">
            <p>
              We've sent a verification email to <strong>{email}</strong>.
            </p>
            <p className="mt-2">
              Please check your inbox and follow the instructions to activate your account.
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="mt-4">
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p>{errorMessage}</p>
                {errorMessage.includes("already registered") && (
                  <Link href="/login">
                    <Button variant="link" className="p-0 h-auto text-red-700 font-medium mt-1">
                      Go to login page
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleEmailSignup} className="space-y-4 w-full">
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
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Signing up...
                </>
              ) : (
                "Sign up with Email"
              )}
            </Button>
          </form>
          
          <div className="flex items-center space-x-2 my-6">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">OR</span>
            <Separator className="flex-1" />
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sign up with Google"
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGithubSignup}
              disabled={isGithubLoading}
            >
              {isGithubLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sign up with GitHub"
              )}
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Login
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
