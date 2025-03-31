import { NextRequest, NextResponse } from 'next/server';
import { createClient } from './utils/supabase/server';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const supabase = await createClient();
  
  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if the user is accessing a dashboard route
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  
  // If it's a dashboard route and the user is not logged in, redirect to login
  if (isDashboardRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    // You can add a redirect parameter to return to the original page after login
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  // This will match all routes that start with /dashboard
  matcher: ['/dashboard/:path*']
};
