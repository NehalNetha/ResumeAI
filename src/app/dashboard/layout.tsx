import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Create a Supabase client
  const supabase = await createClient();
  
  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session exists, redirect to login
  if (!session) {
    redirect('/login?redirectedFrom=/dashboard');
  }
  
  return <DashboardLayout>
    {children}
    <Toaster />

  </DashboardLayout>;
}