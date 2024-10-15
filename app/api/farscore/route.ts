import { init, fetchQuery } from "@airstack/node";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("AIRSTACK_API_KEY is not defined");
}

init(apiKey);

const server = "https://hubs.airstack.xyz";

const cachedFetchAllData = unstable_cache(
  async (userId: string) => {
    console.log(`Attempting to fetch data for userId: ${userId}`);
    let allCasts: any[] = [];
    let totalLikes = 0;
    let totalRecasts = 0;
    let totalReplies = 0;
    let userInfo: any = null;
    let firstCastTimestamp: number | null = null;
    const farcasterEpoch = new Date('2021-01-01T00:00:00Z').getTime() / 1000;

    const MAX_CASTS = 1000000; // Increase this value to fetch more casts
    const RATE_LIMIT_DELAY = 60000 / 3000; // Delay in ms to respect rate limit

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

      userInfo = userDetailsResponse.data?.Socials?.Social[0] || null;

      // Fetch casts using Hub API
      let pageToken: string | null = "";
      let requestCount = 0;
      do {
        if (requestCount >= 300) {
          console.log("Rate limit reached, waiting for 1 minute...");
          await sleep(60000);
          requestCount = 0;
        }

        const castsResponse: AxiosResponse<any> = await axios.get(`${server}/v1/castsByFid`, {
          params: {
            fid: userId,
            pageToken: pageToken || undefined,
            limit: 1000 // Keep this at 1000 to avoid potential API limitations
          },
          headers: {
            "Content-Type": "application/json",
            "x-airstack-hubs": apiKey,
          },
        });

        requestCount++;
        await sleep(RATE_LIMIT_DELAY);

        const newCasts = castsResponse.data.messages || [];
        
        if (newCasts.length > 0 && firstCastTimestamp === null) {
          firstCastTimestamp = newCasts[0].data.timestamp;
        }

        for (const cast of newCasts) {
          totalRecasts += cast.data.reactionCounts?.recast || 0;
          if (cast.data.parentCastId) {
            totalReplies++;
          }
        }

        allCasts = allCasts.concat(newCasts);

        pageToken = castsResponse.data.nextPageToken || null;

        console.log(`Fetched ${allCasts.length} casts so far...`);

      } while (pageToken);

      console.log(`Total casts fetched: ${allCasts.length}`);

      // Fetch total likes using reaction Hub API
      pageToken = "";
      requestCount = 0;
      do {
        if (requestCount >= 300) {
          console.log("Rate limit reached, waiting for 1 minute...");
          await sleep(600);
          requestCount = 0;
        }

        const reactionsResponse: AxiosResponse<any> = await axios.get(`${server}/v1/reactionsByFid`, {
          params: {
            fid: userId,
            pageToken: pageToken || undefined,
            limit: 1000,
            reaction_type: 1 // 1 for likes
          },
          headers: {
            "Content-Type": "application/json",
            "x-airstack-hubs": apiKey,
          },
        });

        requestCount++;
        await sleep(RATE_LIMIT_DELAY);

        totalLikes += reactionsResponse.data.messages.length;

        pageToken = reactionsResponse.data.nextPageToken || null;
      } while (pageToken);

      console.log("Total likes fetched:", totalLikes);
      console.log("Total replies fetched:", totalReplies);

      return { 
        totalCasts: allCasts.length,
        totalLikes,
        totalRecasts,
        totalReplies,
        userInfo,
        firstCastTimestamp
      };
      
    } catch (error) {
      console.error("Error fetching data:", error);
      return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  },
  ['all-data'],
  { revalidate: 3600 }
);

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const data = await cachedFetchAllData(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in GET function:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
