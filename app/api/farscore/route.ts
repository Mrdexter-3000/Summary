import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import axios from 'axios';
import dotenv from 'dotenv';
import { init,fetchQuery } from "@airstack/node";

dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY;

if (!NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not defined");
}

if (!AIRSTACK_API_KEY) {
  throw new Error("AIRSTACK_API_KEY is not defined");
}
init(AIRSTACK_API_KEY);
const client = new NeynarAPIClient(NEYNAR_API_KEY);

const cachedFetchAllData = unstable_cache(
  async (userId: string) => {
    console.log(`Attempting to fetch data for userId: ${userId}`);
    try {
      // Fetch user details using Airstack API
      const userDetailsQuery = `
        query MyQuery($_eq: SocialDappName, $_eq1: String, $blockchain: Blockchain!) {
          Socials(
            input: {filter: {dappName: {_eq: $_eq}, userId: {_eq: $_eq1}}, blockchain: $blockchain}
          ) {
            Social {
              profileDisplayName
              profileHandle
              profileImageContentValue {
                image {
                  small
                }
              }
              farcasterScore {
                farRank
                farScore
              }
              followerCount
            }
          }
        }
      `;

      const userDetailsResponse = await fetchQuery(userDetailsQuery, {
        _eq: "farcaster",
        _eq1: userId,
        blockchain: 'ethereum'
      });

      const userInfo = userDetailsResponse.data?.Socials?.Social[0] || null;

      // Fetch storage usage from Neynar API
      const storageResponse = await axios.get(`https://hub-api.neynar.com/v1/storageLimitsByFid?fid=${userId}`, {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });

      console.log("Storage response:", storageResponse.data);

      let storageUsage = 0;
      let totalCasts = 0;

      if (storageResponse.data && storageResponse.data.casts && storageResponse.data.casts.used) {
        storageUsage = storageResponse.data.casts.used;
        totalCasts = storageUsage;
      } else {
        console.error("Unexpected storage response format:", storageResponse.data);
      }

      // Fetch first cast timestamp from cache
      let firstCastTimestamp = await firstCastCache(userId);

      if (!firstCastTimestamp) {
        console.error("Failed to fetch first cast timestamp");
      }

      // Calculate cast frequency
      let castFrequency = 0;
      if (firstCastTimestamp) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const daysSinceFirstCast = Math.max(1, Math.floor((currentTimestamp - firstCastTimestamp) / 86400));
        castFrequency = Math.round(totalCasts / daysSinceFirstCast);
      }

      return { 
        totalCasts,
        totalLikes: 0, // Set to 0 as per instruction
        userInfo,
        firstCastTimestamp,
        castFrequency,
        storageUsage
      };
      
    } catch (error) {
      console.error("Error fetching data:", error);
      return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  },
  ['all-data'],
  { revalidate: 3600 }
);

const firstCastCache = unstable_cache(
  async (userId: string) => {
    const firstCastResponse = await axios.get(`https://hub-api.neynar.com/v1/castsByFid?pageSize=1&fid=${userId}`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': NEYNAR_API_KEY
      }
    });

    if (firstCastResponse.data && firstCastResponse.data.messages && firstCastResponse.data.messages.length > 0) {
      return firstCastResponse.data.messages[0].data.timestamp;
    }
    return null;
  },
  ['first-cast'],
  { revalidate: 86400 } // Cache for 24 hours
);

const storageUsageCache = unstable_cache(
  async (userId: string) => {
    console.log(`Attempting to fetch storage usage for userId: ${userId}`);
    const storageResponse = await axios.get(`https://hub-api.neynar.com/v1/storageLimitsByFid?fid=${userId}`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': NEYNAR_API_KEY
      }
    });

    console.log("Storage response:", storageResponse.data);

    if (storageResponse.data && storageResponse.data.limits) {
      const castsLimit = storageResponse.data.limits.find((limit: { storeType: string; }) => limit.storeType === 'STORE_TYPE_CASTS');
      if (castsLimit) {
        return {
          storageUsage: castsLimit.used,
          totalCasts: castsLimit.used
        };
      }
    }

    console.error("Unexpected storage response format:", storageResponse.data);
    return { storageUsage: 0, totalCasts: 0 };
  },
  ['storage-usage'],
  { revalidate: 7200 } // Cache for 2 hours
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  console.log(`Attempting to fetch data for userId: ${userId}`);
  try {
    // Fetch user details using Airstack API
    const userDetailsQuery = `
      query MyQuery($_eq: SocialDappName, $_eq1: String, $blockchain: Blockchain!) {
        Socials(
          input: {filter: {dappName: {_eq: $_eq}, userId: {_eq: $_eq1}}, blockchain: $blockchain}
        ) {
          Social {
            profileDisplayName
            profileHandle
            profileImageContentValue {
              image {
                small
              }
            }
            farcasterScore {
              farRank
              farScore
            }
            followerCount
          }
        }
      }
    `;

    const userDetailsResponse = await fetchQuery(userDetailsQuery, {
      _eq: "farcaster",
      _eq1: userId,
      blockchain: 'ethereum'
    });

    const userInfo = userDetailsResponse.data?.Socials?.Social[0] || null;

    // Fetch storage usage and total casts from cache
    console.log(`Attempting to retrieve storage usage for userId: ${userId}`);
    const { storageUsage, totalCasts } = await storageUsageCache(userId);
    console.log(`Storage usage retrieved for userId: ${userId}`);

    // Fetch first cast timestamp from cache
    let firstCastTimestamp = await firstCastCache(userId);

    if (!firstCastTimestamp) {
      console.error("Failed to fetch first cast timestamp");
    }

    // Calculate cast frequency
    let castFrequency = 0;
    if (firstCastTimestamp) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const daysSinceFirstCast = Math.max(1, Math.floor((currentTimestamp - firstCastTimestamp) / 86400));
      castFrequency = Math.round(totalCasts / daysSinceFirstCast);
    }

    const responseData = { 
      totalCasts,
      totalLikes: 0, // Set to 0 as per instruction
      userInfo,
      firstCastTimestamp,
      castFrequency,
      storageUsage
    };

    // Create the response with caching headers
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return response;
  } catch (error: unknown) {
    console.error("Error fetching data:", error);
    if (error instanceof Error && 'response' in error) {
      console.error("Error response:", (error as any).response?.data);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unexpected error occurred" }, { status: 500 });
  }
}
