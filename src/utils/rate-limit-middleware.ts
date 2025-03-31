import { NextResponse } from 'next/server';
import { RateLimit } from './rate-limit';
import { createClient } from '@/utils/supabase/server';

export async function withRateLimit(
  request: Request,
  rateLimiter: RateLimit,
  handler: (request: Request) => Promise<NextResponse>
) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use IP address as fallback if user is not authenticated
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';
    
    // Use user ID if available, otherwise use IP
    const rateKey = session?.user?.id || clientIp;
    
    // Check rate limit
    const rateLimit = await rateLimiter.check(rateKey);
    
    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
    
    // If rate limit exceeded, return error
    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: headers,
          statusText: 'Too Many Requests' 
        }
      );
    }
    
    // Call the original handler
    const response = await handler(request);
    
    // Add rate limit headers to the response
    rateLimit.limit && response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    rateLimit.remaining && response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    rateLimit.reset && response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
    
    return response;
  } catch (error) {
    console.error('Rate limit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}