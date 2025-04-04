"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, User, Mail, CreditCard, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { fetchUserCredits } from '@/utils/credits/credits';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    email: string;
    name: string | null;
    created_at: string;
  } | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState('');
  
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Get user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(userError?.message || "User not authenticated");
      }
      
      // Get user profile from profiles table if it exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Set user profile data
      setUserProfile({
        id: user.id,
        email: user.email || '',
        name: profileData?.name || user.user_metadata?.name || null,
        created_at: user.created_at,
      });
      
      if (profileData?.name) {
        setName(profileData.name);
      } else if (user.user_metadata?.name) {
        setName(user.user_metadata.name);
      }
      
      // Get user credits
      const credits = await fetchUserCredits(user.id);
      setUserCredits(credits);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    
    setIsUpdating(true);
    
    try {
      // Update profile in the profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userProfile.id,
          name: name,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, name } : null);
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!userProfile) return;
    
    setIsDeleting(true);
    
    try {
      // Delete all user data from various tables
      
      // 1. Delete resumes from storage
      const { data: resumeFiles, error: listError } = await supabase
        .storage
        .from('resumes')
        .list(`${userProfile.id}`);
      
      if (!listError && resumeFiles && resumeFiles.length > 0) {
        await supabase
          .storage
          .from('resumes')
          .remove(resumeFiles.map(file => `${userProfile.id}/${file.name}`));
      }
      
      // 2. Delete created resumes from storage
      const { data: createdResumeFiles, error: createdListError } = await supabase
        .storage
        .from('created-resumes')
        .list(`${userProfile.id}`);
      
      if (!createdListError && createdResumeFiles && createdResumeFiles.length > 0) {
        await supabase
          .storage
          .from('created-resumes')
          .remove(createdResumeFiles.map(file => `${userProfile.id}/${file.name}`));
      }
      
      // 3. Delete saved resumes from database
      await supabase
        .from('saved_resumes')
        .delete()
        .eq('user_id', userProfile.id);
      
      // 4. Delete resume info from database
      await supabase
        .from('resume_info')
        .delete()
        .eq('user_id', userProfile.id);
      
      // 5. Delete user credits from database
      await supabase
        .from('user_credits')
        .delete()
        .eq('user_id', userProfile.id);
      
      // 6. Delete profile from database
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userProfile.id);
      
      // 7. Call the API route to delete the user account instead of using admin API directly
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userProfile.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
      
      // Sign out the user
      await supabase.auth.signOut();
      
      toast.success("Account deleted successfully");
      
      // Redirect to home page
      router.push('/');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              <span>{userCredits} credits</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto w-full">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{userProfile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member since</p>
                    <p>{userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Settings</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating || !name.trim()}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-500">
                  Deleting your account will remove all of your data permanently. This action cannot be undone.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all of your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}