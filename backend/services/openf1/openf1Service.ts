/**
 * OpenF1 Service (Real Formula 1 Live Data Integration)
 * Docs: https://openf1.org
 */

import { CompoundType } from "../../../src/types";

// Base API URL
const OPENF1_BASE_URL = process.env.OPENF1_BASE_URL || "https://api.openf1.org/v1";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Memory Cache with TTL to adhere to OpenF1 rate-limiting guideline
class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxAgeMs: number = 10000; // 10 seconds default TTL

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.maxAgeMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (customTTL ? customTTL - this.maxAgeMs : 0)
    });
  }
}

const cache = new MemoryCache();

// Helper fetch client with dynamic retries and exponential fallbacks
async function openf1Fetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const queryStr = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v.toString())}`)
    .join("&");
  
  const url = `${OPENF1_BASE_URL}/${endpoint}${queryStr ? "?" + queryStr : ""}`;
  const cached = cache.get<T>(url);
  if (cached) {
    return cached;
  }

  let attempt = 0;
  const maxAttempts = 2; // Keep attempts low since live telemetry polls frequently
  let delay = 500;

  while (attempt < maxAttempts) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      clearTimeout(id);

      if (res.status === 404) {
        // Specific fast-return for not found sessions/endpoints without throwing/noise
        const fallback = [] as any as T;
        cache.set(url, fallback, Date.now() + 60000); // cache 404s for 60 seconds to avoid repeating
        return fallback;
      }

      if (res.status === 429) {
        console.warn(`OpenF1 Rate-limited (429) on Path: ${endpoint}. Temporarily shifting to background simulation.`);
        const fallback = [] as any as T;
        cache.set(url, fallback, Date.now() + 30000); // cache rate limits for 30s
        return fallback;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      cache.set(url, data);
      return data as T;
    } catch (err: any) {
      attempt++;
      if (attempt >= maxAttempts) {
        // Quiet warning, fallback to default empty list to guarantee uptime
        console.warn(`OpenF1 Service stand-by on path: ${endpoint}. Fallback applied.`);
        return [] as any as T;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
  return [] as any as T;
}

export class OpenF1Service {
  /**
   * Fetch active session data
   */
  static async getLiveSession(sessionKey: number = 9543): Promise<any> {
    try {
      const data = await openf1Fetch<any[]>("sessions", { session_key: sessionKey });
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetch driver positions in real-time
   */
  static async getLivePositions(sessionKey: number = 9543): Promise<any[]> {
    try {
      // get latest positions
      const data = await openf1Fetch<any[]>("position", { session_key: sessionKey });
      return data || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch telemetry data for a specific driver
   */
  static async getLiveTelemetry(sessionKey: number = 9543, driverNumber?: number): Promise<any[]> {
    try {
      const params: Record<string, string | number> = { session_key: sessionKey };
      if (driverNumber) params.driver_number = driverNumber;
      
      // Limit count of points to prevent overloading the browser
      const data = await openf1Fetch<any[]>("car_data", params);
      return (data || []).slice(-100); // return top 100 historical telemetry points
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch weather statistics
   */
  static async getLiveWeather(sessionKey: number = 9543): Promise<any> {
    try {
      const data = await openf1Fetch<any[]>("weather", { session_key: sessionKey });
      return data && data.length > 0 ? data[data.length - 1] : null; // returns latest weather report
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetch active laps history
   */
  static async getLiveLapTimes(sessionKey: number = 9543, driverNumber?: number): Promise<any[]> {
    try {
      const params: Record<string, string | number> = { session_key: sessionKey };
      if (driverNumber) params.driver_number = driverNumber;
      const data = await openf1Fetch<any[]>("laps", params);
      return data || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch race control messages (e.g. Yellow flags, VSC triggers)
   */
  static async getRaceControlMessages(sessionKey: number = 9543): Promise<any[]> {
    try {
      const data = await openf1Fetch<any[]>("race_control", { session_key: sessionKey });
      return data || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch interactive pit stop actions
   */
  static async getPitStops(sessionKey: number = 9543): Promise<any[]> {
    try {
      const data = await openf1Fetch<any[]>("pit", { session_key: sessionKey });
      return data || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch live team radio packets
   */
  static async getTeamRadio(sessionKey: number = 9543): Promise<any[]> {
    try {
      const data = await openf1Fetch<any[]>("team_radio", { session_key: sessionKey });
      return data || [];
    } catch (err) {
      return [];
    }
  }
}
