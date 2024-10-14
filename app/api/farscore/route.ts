import { init, fetchQuery } from "@airstack/node";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';

const apiKey = process.env.AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("AIRSTACK_API_KEY is not defined");
}
init(apiKey);

console.log("Airstack API initialized");

// Simple in-memory cache
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const userQuery = `
query GetUserFarcasterData($fid: String!, $limit: Int!) {
  Socials(
    input: {filter: {dappName: {_eq: farcaster}, identity: {_eq: $fid}}, blockchain: ethereum}
  ) {
    Social {
      profileName
      profileDisplayName
      userId
      farcasterProfile {
        fname
        fid
        followingCount
        followerCount
      }
      farcasterScore {
        score
        rank
      }
    }
  }
  Farcaster(input: {filter: {fid: {_eq: $fid}}}) {
    Casts(limit: $limit) {
      hash
      text
      timestamp
    }
  }
}
`;

async function fetchAndCacheUserData(fid: string) {
  const cacheKey = `farcaster_${fid}`;
  const cachedData = cache[cacheKey];

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log("Returning cached data for FID:", fid);
    return cachedData.data;
  }

  console.log(`Fetching data from Airstack for FID: ${fid}`);
  const { data, error } = await fetchQuery(userQuery, { fid, limit: 100 });

  if (error) {
    throw new Error(`Airstack API error: ${error.message}`);
  }

  cache[cacheKey] = { data, timestamp: Date.now() };
  return data;
}

async function checkNewCasts(fid: string) {
  const cacheKey = `farcaster_${fid}`;
  const cachedData = cache[cacheKey];

  if (!cachedData) {
    return await fetchAndCacheUserData(fid);
  }

  const { data: newData } = await fetchQuery(userQuery, { fid, limit: 10 });
  const oldCasts = cachedData.data.Farcaster.Casts;
  const newCasts = newData.Farcaster.Casts;

  if (newCasts[0].hash !== oldCasts[0].hash) {
    console.log("New casts found, updating cache");
    cache[cacheKey] = { data: newData, timestamp: Date.now() };
    return newData;
  }

  console.log("No new casts found, returning cached data");
  return cachedData.data;
}

const likesReceivedQuery = `
query LikesReceived($blockchain: String!, $eq: String!) {
  FarcasterCasts(
    input: {filter: {blockchain: {_eq: $blockchain}, fid: {_eq: $eq}}}
  ) {
    Cast {
      numberOfLikes
    }
  }
}
`;

const cachedFetchLikesData = unstable_cache(
  async (userId: string) => {
    console.log(`Fetching likes data for userId: ${userId}`);
    try {
      const likesData = await fetchQuery(likesReceivedQuery, { blockchain: 'ALL', _eq: `fc_fid:${userId}` });
      console.log("Raw likes data:", JSON.stringify(likesData, null, 2));
      return likesData;
    } catch (error) {
      console.error("Error fetching likes data:", error);
      return { error: "Failed to fetch likes data" };
    }
  },
  ['likes-data'],
  { revalidate: 3600 } // Cache for 1 hour
);

const cachedFetchUserData = unstable_cache(
  async (userId: string) => {
    console.log(`Fetching user data for userId: ${userId}`);
    try {
      const userData = await fetchAndCacheUserData(userId);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { error: "Failed to fetch user data" };
    }
  },
  ['user-data'],
  { revalidate: 3600 } // Cache for 1 hour
);

export async function GET(req: NextRequest) {
  console.log(`API route called at ${new Date().toISOString()}`);
  console.log(`Full URL: ${req.url}`);

  const userId = req.nextUrl.searchParams.get("userId");
  console.log(`Requested userId: ${userId}`);

  if (!userId) {
    console.log("Error: userId parameter is missing");
    return NextResponse.json(
      { error: "userId parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`Attempting to fetch data for userId: ${userId}`);
    const [userData, likesData] = await Promise.all([
      cachedFetchUserData(userId),
      cachedFetchLikesData(userId)
    ]);
    console.log(`Data fetching completed for userId: ${userId}`);

    console.log("User data:", JSON.stringify(userData, null, 2));
    console.log("Likes data:", JSON.stringify(likesData, null, 2));

    if (userData.error) {
      console.error("Airstack API error (user data):", userData.error);
      return NextResponse.json(
        { error: userData.error.message },
        { status: 500 }
      );
    }

    const socialData = userData.data?.Socials?.Social[0];
    if (!socialData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let totalLikesReceived = 0;
    if (likesData && 'data' in likesData && likesData.data?.FarcasterCasts?.Cast) {
      totalLikesReceived = likesData.data.FarcasterCasts.Cast.reduce(
        (sum: number, cast: any) => sum + (cast.numberOfLikes || 0),
        0
      );
    } else {
      console.warn("Likes data is missing or in unexpected format");
    }

    const responseData = {
      userData: socialData,
      farcasterScore: socialData.socialCapital?.socialCapitalScore || 0,
      farcasterRank: socialData.socialCapital?.socialCapitalRank || 0,
      totalLikesReceived,
    };

    console.log("Response data:", JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
