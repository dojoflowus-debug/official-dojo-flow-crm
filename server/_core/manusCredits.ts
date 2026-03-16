/**
 * Manus Credits Service
 *
 * Fetches real credit balance from the Manus Forge API (BUILT_IN_FORGE_API_KEY).
 * The credits shown here are the Manus platform credits for this project/account.
 */

import { ENV } from "./env";

export interface ManusCreditsBalance {
  freeCredits: number;
  monthlyCredits: number;
  monthlyCreditsUsed: number;
  monthlyCreditsTotal: number;
  dailyRefreshCredits: number;
  dailyRefreshLimit: number;
  totalAvailable: number;
}

/**
 * Fetch the real Manus credit balance from the Forge API.
 * Endpoint: webdevtoken.v1.WebDevService/GetCredits
 */
export async function getManusCredits(): Promise<ManusCreditsBalance | null> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.warn("[ManusCredits] Forge API not configured");
    return null;
  }

  try {
    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL(
      "webdevtoken.v1.WebDevService/GetCredits",
      baseUrl
    ).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[ManusCredits] API error ${response.status}: ${detail}`
      );
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data) return null;

    // Parse the Manus credit response format
    // The API returns: free_credits, monthly_credits, monthly_credits_used,
    // monthly_credits_total, daily_refresh_credits, daily_refresh_limit
    return {
      freeCredits: Number(data.free_credits ?? data.freeCredits ?? 0),
      monthlyCredits: Number(data.monthly_credits ?? data.monthlyCredits ?? 0),
      monthlyCreditsUsed: Number(
        data.monthly_credits_used ?? data.monthlyCreditsUsed ?? 0
      ),
      monthlyCreditsTotal: Number(
        data.monthly_credits_total ?? data.monthlyCreditsTotal ?? 0
      ),
      dailyRefreshCredits: Number(
        data.daily_refresh_credits ?? data.dailyRefreshCredits ?? 0
      ),
      dailyRefreshLimit: Number(
        data.daily_refresh_limit ?? data.dailyRefreshLimit ?? 200
      ),
      totalAvailable: Number(data.total_available ?? data.totalAvailable ?? 0),
    };
  } catch (error) {
    console.error("[ManusCredits] Failed to fetch credits:", error);
    return null;
  }
}

/**
 * Get the Manus credit purchase / top-up URL.
 * Redirects the user to the Manus billing portal to add more credits.
 */
export function getManusAddCreditsUrl(): string {
  // Manus billing portal URL for adding credits
  return "https://manus.im/pricing";
}
