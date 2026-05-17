import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await rateLimit.limit(identifier);
  if (!success) {
    throw new Error(`Rate limit exceeded. Reset in ${reset}ms`);
  }
  return { limit, remaining, reset };
}
