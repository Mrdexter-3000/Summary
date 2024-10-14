import { Button } from "frames.js/next";
import React from "react";
import { frames } from "./frames";
import { appURL, formatNumber } from "../utils";
import { text } from "stream/consumers";
import axios from 'axios';
import dotenv from 'dotenv';
import { unstable_cache } from 'next/cache';
dotenv.config();


interface State {
  lastFid?: string;
}

interface MoxieData {
  today: { allEarningsAmount: string };
  weekly: { allEarningsAmount: string };
  lifetime: { allEarningsAmount: string };
}

interface EngagementData {
  like: string;
  reply: string;
  recast: string;
}

const frameHandler = frames(async (ctx) => {
  interface UserData {
    name: string;
    username: string;
    fid: string;
    profileDisplayName: string;
    profileImageUrl: string;
    totalCasts: number;
    totalLikes: number;
    totalRecasts: number;
    totalComments: number;
    firstCastDate: string;
    daysRegistered: number;
    farcasterScore: number;
    farcasterRank: number;
    followers: string;
  }

  let userData: UserData | null = null;
  let moxieData: MoxieData | null = null;
  

  let error: string | null = null;
  let isLoading = false;

  const fetchFarscoreData = async (fid: string) => {
    try {
      const farscoreUrl = `${appURL()}/api/farscore?userId=${fid}`;
      const farscoreResponse = await fetch(farscoreUrl);
      if (!farscoreResponse.ok) {
        throw new Error(`Farscore API HTTP error! status: ${farscoreResponse.status}`);
      }
      const data = await farscoreResponse.json();
      return {
        farcasterScore: data.farcasterScore,
        farcasterRank: data.farcasterRank,
        totalLikesReceived: data.totalLikesReceived,
      };
    } catch (err) {
      console.error("Error fetching Farscore data:", err);
      return {
        farcasterScore: 0,
        farcasterRank: 0,
        totalLikesReceived: 0,
      };
    }
  };
  const fetchUserData = async (fid: string) => {
    isLoading = true;
   
    const server = "https://hubs.airstack.xyz";

    try {
      console.log(`Fetching user data for FID: ${fid}`);

      // Fetch user profile data
      const userUrl = `${server}/v1/userDataByFid?fid=${fid}`;
      const userResponse = await axios.get(userUrl, {
        headers: {
          "Content-Type": "application/json",
          "x-airstack-hubs": process.env.AIRSTACK_API_KEY as string,
        },
      });

      if (!userResponse.data.messages || userResponse.data.messages.length === 0) {
        throw new Error(`User data not found for FID: ${fid}`);
      }

      const profileData = {
        username: '',
        displayName: '',
        pfp: '',
        bio: '',
        followers: '0',
      };

      userResponse.data.messages.forEach((message: any) => {
        const { type, value } = message.data.userDataBody;
        switch (type) {
          case 'USER_DATA_TYPE_USERNAME':
            profileData.username = value;
            break;
          case 'USER_DATA_TYPE_DISPLAY':
            profileData.displayName = value;
            break;
          case 'USER_DATA_TYPE_PFP':
            profileData.pfp = value;
            break;
          case 'USER_DATA_TYPE_BIO':
            profileData.bio = value;
            break;
        }
      });

      // Fetch casts
      let allCasts: any[] = [];
      let pageToken = '';
      let firstCast = null;
      let totalCasts = 0;
      let totalLikes = 0;
      let totalRecasts = 0;
      let totalComments = 0;
      let totalLikesSinceFirstCast = 0;

      do {
        const castsUrl = `${server}/v1/castsByFid?fid=${fid}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const castsResponse = await axios.get(castsUrl, {
          headers: {
            "Content-Type": "application/json",
            "x-airstack-hubs": process.env.AIRSTACK_API_KEY as string,
          },
        });

        if (castsResponse.data.messages && castsResponse.data.messages.length > 0) {
          if (!firstCast) {
            firstCast = castsResponse.data.messages[0];
          }
          totalCasts += castsResponse.data.messages.length;
          const newLikes = castsResponse.data.messages.reduce((sum: number, cast: any) => sum + (cast.reactions?.likes || 0), 0);
          totalLikes += newLikes;
          totalLikesSinceFirstCast += newLikes;
          totalRecasts += castsResponse.data.messages.reduce((sum: number, cast: any) => sum + (cast.reactions?.recasts || 0), 0);
          totalComments += castsResponse.data.messages.filter((cast: any) => 
            cast.data && cast.data.castAddBody && cast.data.castAddBody.parentCastId
          ).length;
          pageToken = castsResponse.data.nextPageToken || '';
        } else {
          break;
        }
      } while (pageToken && totalCasts );

      const firstCastTimestamp = firstCast?.data?.timestamp;
      const farcasterEpoch = new Date('2021-01-01T00:00:00Z').getTime() / 1000;
      const firstCastDate = firstCastTimestamp 
        ? new Date((parseInt(firstCastTimestamp) + farcasterEpoch) * 1000).toISOString().split('T')[0] 
        : 'N/A';
      const daysRegistered = firstCastTimestamp 
        ? Math.floor((Date.now() - (parseInt(firstCastTimestamp) + farcasterEpoch) * 1000) / (1000 * 60 * 60 * 24)) 
        : 0;

      const farscoreData = await fetchFarscoreData(fid);

      userData = {
        name: profileData.displayName || profileData.username || "Unknown",
        username: profileData.username || "unknown",
        fid: fid,
        profileDisplayName: profileData.displayName || "N/A",
        profileImageUrl: profileData.pfp || "",
        totalCasts,
        totalLikes: farscoreData.totalLikesReceived,
        totalRecasts,
        totalComments,
        firstCastDate,
        daysRegistered,
        farcasterScore: farscoreData.farcasterScore || 0,
        farcasterRank: farscoreData.farcasterRank || 0,
        followers: profileData.followers || '0',
      };

      console.log('User data processed successfully:', userData);
      console.log('Total likes:', totalLikes);
      console.log('Total likes since first cast:', totalLikesSinceFirstCast);
    } catch (err) {
      console.error("Error fetching user data:", err);
      error = err instanceof Error ? err.message : "An unexpected error occurred";
    } finally {
      isLoading = false;
    }
  };

  const fetchMoxieData = async (fid: string) => {
    try {
      const moxieUrl = `${appURL()}/api/moxie-earnings?entityId=${encodeURIComponent(
        fid
      )}`;
      const moxieResponse = await fetch(moxieUrl);
      if (!moxieResponse.ok) {
        throw new Error(`Moxie HTTP error! status: ${moxieResponse.status}`);
      }
      moxieData = await moxieResponse.json();
    } catch (err) {
      console.error("Error fetching Moxie data:", err);
      error = (err as Error).message;
    }
  };

  const extractFid = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      let fid = parsedUrl.searchParams.get("userfid");

      console.log("Extracted FID from URL:", fid);
      return fid;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };

  let fid: string | null = null;

  if (ctx.message?.requesterFid) {
    fid = ctx.message.requesterFid.toString();
    console.log("Using requester FID:", fid);
  } else if (ctx.url) {
    fid = extractFid(ctx.url.toString());
    console.log("Extracted FID from URL:", fid);
  } else {
    console.log("No ctx.url available");
  }

  if (!fid && (ctx.state as State)?.lastFid) {
    fid = (ctx.state as State).lastFid ?? null;
    console.log("Using FID from state:", fid);
  }

  console.log("Final FID used:", fid);

  const shouldFetchData =
    fid && (!userData || (userData as UserData).fid !== fid);

  if (shouldFetchData && fid) {
    await fetchUserData(fid);
  }

  const SplashScreen = () => ({
    image: "https://uqmhcw5knmkdj4wh.public.blob.vercel-storage.com/splash-Rdu7ATWoRkov7e7eYcpKORd5vuyCTD.gif",
  });

  const ActivityScreen = () => {
    console.log("Rendering ActivityScreen");
    console.log("userData:", userData);

    if (error) {
      const errorMessage = error.includes("User data not found") 
        ? "User not found. Please check the FID and try again." 
        : "An error occurred while fetching user data. Please try again later.";
      return {
        image: `${appURL()}/api/og?error=${encodeURIComponent(errorMessage)}`,
      };
    }

    const ogImageUrl = `${appURL()}/api/og?` + new URLSearchParams({
      name: userData?.profileDisplayName || 'Unknown',
      username: userData?.username || 'unknown',
      fid: userData?.fid || 'N/A',
      totalCasts: userData?.totalCasts?.toString() || '0',
      totalComments: userData?.totalComments?.toString() || '0',
      totalReactions: (userData?.totalLikes || 0).toString(),
      firstCastDate: userData?.firstCastDate || 'N/A',
      daysRegistered: userData?.daysRegistered?.toString() || '0',
      farcasterScore: userData?.farcasterScore?.toString() || '0',
      farcasterRank: userData?.farcasterRank?.toString() || '0',
      profileImageUrl: encodeURIComponent(userData?.profileImageUrl || ''),
      followers: userData?.followers || '0',
      cache: Date.now().toString(),
    }).toString();

    console.log("OG Image URL:", ogImageUrl);

    return {
      image: ogImageUrl,
    };
  };

  const shareText = encodeURIComponent(
    `🔍 Curious about your Moxie? All stats revealed here! 
    frame by @0xdexter Tip for awesomeness`
  );

  // Change the url here
  const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=https://moxie-stat.vercel.app/frames${
    fid ? `?userfid=${fid}` : ""
  }`;

  const buttons = [];

  if (!userData) {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        My Stats
      </Button>,
      <Button
        action="link"
        
        target="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fmoxie-stat.vercel.app%2Fapi%2Fcast-action"
      >
        Cast Action
      </Button>,
    );
  } else {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        Refresh
      </Button>,
      <Button action="link" target={shareUrl}>
        Share
      </Button>,
      <Button action="link" target="https://warpcast.com/0xdexter/0xa911067c">
        Tip here
      </Button>
    );
  }

  return {
    ...(fid && !error ? ActivityScreen() : SplashScreen()),
    buttons: buttons,
  };
});

export const GET = frameHandler;
export const POST = frameHandler;