"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false); // Add this state
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const supabase = createClient();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkSession();
  }, []);
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Check if the error is specifically about email not being confirmed
        if (error.message.includes('Email not confirmed')) {
          setVerificationNeeded(true);
          return;
        }
        
        // For invalid credentials, set error message
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Account not found. Please check your credentials or sign up for a new account.');
          return;
        }
        
        // For other errors
        setErrorMessage(error.message || "Failed to log in");
        return;
      }
      
      toast.success("Logged in successfully");
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendVerificationEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      toast.success("Verification email resent. Please check your inbox.");
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.message || "Failed to resend verification email");
    }
  };
  
  const handleGoogleLogin = async () => {
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
      console.error('Google login error:', error);
      toast.error(error.message || "Failed to log in with Google");
      setIsGoogleLoading(false);
    }
  };
  
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
      console.error('GitHub login error:', error);
      toast.error(error.message || "Failed to log in with GitHub");
      setIsGithubLoading(false);
    }
  };
  
  return (
    <AuthLayout 
      title="Welcome back" 
      description="Sign in to your account to continue"
    >
      {verificationNeeded ? (
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium">Email verification required</h3>
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md text-sm">
            <p>Your email address <strong>{email}</strong> needs to be verified before you can log in.</p>
            <p className="mt-2">Please check your inbox for the verification email and click the link to verify your account.</p>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Didn't receive the email? Check your spam folder or</p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-500 font-medium"
              onClick={resendVerificationEmail}
            >
              click here to resend
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setVerificationNeeded(false)}
          >
            Try another account
          </Button>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p>{errorMessage}</p>
                {errorMessage.includes("Account not found") && (
                  <Link href="/signup">
                    <Button variant="link" className="p-0 h-auto text-red-700 font-medium mt-1">
                      Sign up for a new account
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleEmailLogin} className="space-y-4 w-full">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/reset-password" 
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Forgot password?
                </Link>
              </div>
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
                  Signing in...
                </>
              ) : (
                "Sign in with Email"
              )}
            </Button>
          </form>
          
          <div className="flex items-center space-x-2 my-6">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">OR</span>
            <Separator className="flex-1" />
          </div>
          
          <div className=" space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <div className='flex flex-row '>
                <Image 
                  src="/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Sign in with Google
              </div>
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
                <div className='flex flex-row '>
                <Image 
                  src="/github-light.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Sign in with Github
              </div>
              )}
            </Button>

          </div>
          <p className="text-sm text-gray-500 text-center mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign up
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}