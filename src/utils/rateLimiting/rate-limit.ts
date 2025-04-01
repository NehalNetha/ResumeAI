export interface RateLimitConfig {
    intervalInMs: number;
    maxRequests: number;
  }
  
  export class RateLimit {
    private timestamps: Map<string, number[]> = new Map();
  
    constructor(private config: RateLimitConfig) {}
  
    private cleanup(key: string) {
      const now = Date.now();
      const timestamps = this.timestamps.get(key) || [];
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < this.config.intervalInMs
      );
      if (validTimestamps.length > 0) {
        this.timestamps.set(key, validTimestamps);
      } else {
        this.timestamps.delete(key);
      }
    }
  
    async check(key: string): Promise<{
      success: boolean;
      limit: number;
      remaining: number;
      reset: number;
    }> {
      this.cleanup(key);
      const now = Date.now();
      const timestamps = this.timestamps.get(key) || [];
      
      const response = {
        success: timestamps.length < this.config.maxRequests,
        limit: this.config.maxRequests,
        remaining: Math.max(0, this.config.maxRequests - timestamps.length),
        reset: timestamps.length > 0 ? 
          Math.max(0, this.config.intervalInMs - (now - timestamps[0])) : 0
      };
  
      if (response.success) {
        timestamps.push(now);
        this.timestamps.set(key, timestamps);
      }
  
      return response;
    }
  }
  
  // Create rate limiters with different configurations
  const rateLimiters = {
    chat: new RateLimit({ intervalInMs: 60 * 1000, maxRequests: 10 }), // 10 requests per minute
    gemini: new RateLimit({ intervalInMs: 60 * 1000, maxRequests: 5 }), // 5 requests per minute
    default: new RateLimit({ intervalInMs: 60 * 1000, maxRequests: 20 }) // 20 requests per minute
  };
  
  export { rateLimiters };