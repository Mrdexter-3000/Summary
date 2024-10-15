import { Button } from "frames.js/next";
import React from "react";
import { frames } from "./frames";
import { appURL, formatNumber } from "../utils";
import { text } from "stream/consumers";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


interface State {
  lastFid?: string | null;
}



interface EngagementData {
  like: string;
  reply: string;
  recast: string;
}

interface UserData {
  name: string;
  username: string;
  fid: string;
  profileDisplayName: string;
  profileHandle: string;
  profileImageUrl: string;
  totalCasts: number;
  totalLikes: number;
  totalRecasts: number;
  totalReplies: number;
  totalLikesReceived: number;
  totalRecastsReceived: number;
  firstCastDate: string;
  daysRegistered: number;
  farcasterScore: number;
  farcasterRank: number;
  followers: number;
}

const fetchUserData = async (fid: string): Promise<UserData | null> => {
  try {
    console.log(`Fetching user data for FID: ${fid}`);
    const response = await axios.get(`${appURL()}/api/farscore?userId=${fid}`);
    console.log(`API response status: ${response.status}`);
    console.log(`API response data:`, response.data);

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = response.data;

    if (data.error) {
      console.error("Error from API:", data.error);
      return null;
    }

    const userInfo = data.userInfo || {};
    const casts = data.FarcasterCasts?.Cast || [];

    const farcasterEpoch = new Date('2021-01-01T00:00:00Z').getTime() / 1000;
    const firstCastTimestamp = data.firstCastTimestamp;
    const firstCastDate = firstCastTimestamp 
      ? new Date((parseInt(firstCastTimestamp) + farcasterEpoch) * 1000).toISOString().split('T')[0] 
      : 'N/A';
    const daysRegistered = firstCastTimestamp 
      ? Math.floor((Date.now() - (parseInt(firstCastTimestamp) + farcasterEpoch) * 1000) / (1000 * 60 * 60 * 24)) 
      : 0;

    const userData: UserData = {
      name: userInfo.profileDisplayName || 'Unknown',
      username: userInfo.profileHandle || 'unknown',
      fid,
      profileDisplayName: userInfo.profileDisplayName || 'Unknown',
      profileHandle: userInfo.profileHandle || 'unknown',
      profileImageUrl: userInfo.profileImageContentValue?.image?.small || '',
      totalCasts: data.totalCasts || 0,
      totalLikes: data.totalLikes || 0,
      totalRecasts: data.totalRecasts || 0,
      totalReplies: data.totalReplies || 0,
      totalLikesReceived: data.totalLikesReceived || 0,
      totalRecastsReceived: data.totalRecastsReceived || 0,
      firstCastDate,
      daysRegistered,
      farcasterScore: userInfo.farcasterScore?.farScore || 0,
      farcasterRank: userInfo.farcasterScore?.farRank || 0,
      followers: parseInt(userInfo.followerCount) || 0,
    };
    console.log(`Total casts for user ${fid}: ${userData.totalCasts}`);

    return userData;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

const frameHandler = frames(async (ctx) => {
  let userData: UserData | null = null;
  let error: string | null = null;
  let isLoading = false;

  // Extract 'fid' from the URL, frameActionBody, or state
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

  if (fid) {
    try {
      userData = await fetchUserData(fid);
      if (!userData) {
        error = "User not found or data unavailable";
      }
    } catch (err) {
      console.error("Error in fetchUserData:", err);
      error = "An error occurred while fetching user data";
    }
  } else {
    error = "No FID provided";
  }

  // Function to fetch Farscore data (if needed)
  const fetchFarscoreData = async (fid: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/farscore?userId=${fid}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching Farscore data:", error);
      if (axios.isAxiosError(error)) {
        throw new Error("Farscore API HTTP error! status: " + (error.response?.status || "unknown"));
      } else {
        throw new Error("An unknown error occurred while fetching Farscore data");
      }
    }
  };

  // Define SplashScreen
  const SplashScreen = () => ({
    image: "https://uqmhcw5knmkdj4wh.public.blob.vercel-storage.com/splash-Rdu7ATWoRkov7e7eYcpKORd5vuyCTD.gif",
    buttons: [
      <Button action="post" target={{ href: `${appURL()}` }}>
        Check Me
      </Button>
    ],
    input: {
      text: "Enter your FID",
    },
  });

  // Define ActivityScreen
  const ActivityScreen = () => {
    console.log("Rendering ActivityScreen");
    console.log("userData:", userData);

    if (!userData) {
      return {
        image: `${appURL()}/api/og?error=${encodeURIComponent(error || "User data not available")}`,
        buttons: [
          <Button action="post" target={{ href: `${appURL()}` }}>
            Try Again
          </Button>
        ],
      };
    }

    const ogImageUrl = new URL(`${appURL()}/api/og`);
    ogImageUrl.searchParams.append('name', userData.name);
    ogImageUrl.searchParams.append('username', userData.username);
    ogImageUrl.searchParams.append('fid', userData.fid);
    ogImageUrl.searchParams.append('totalCasts', userData.totalCasts.toString());
    ogImageUrl.searchParams.append('totalReplies', userData.totalReplies.toString());
    ogImageUrl.searchParams.append('totalLikes', userData.totalLikes.toString());
    ogImageUrl.searchParams.append('totalRecasts', userData.totalRecasts.toString());
    ogImageUrl.searchParams.append('totalLikesReceived', userData.totalLikesReceived.toString());
    ogImageUrl.searchParams.append('totalRecastsReceived', userData.totalRecastsReceived.toString());
    ogImageUrl.searchParams.append('firstCastDate', userData.firstCastDate);
    ogImageUrl.searchParams.append('daysRegistered', userData.daysRegistered.toString());
    ogImageUrl.searchParams.append('farcasterScore', userData.farcasterScore.toString());
    ogImageUrl.searchParams.append('farcasterRank', userData.farcasterRank.toString());
    ogImageUrl.searchParams.append('followers', userData.followers.toString());
    ogImageUrl.searchParams.append('profileImageUrl', userData.profileImageUrl);

    console.log("OG Image URL:", ogImageUrl);

    return {
      image: ogImageUrl.toString(),
      buttons: [
        <Button action="link" target={shareUrl}>
          Share
        </Button>,
        <Button action="link" target="https://warpcast.com/0xdexter/0xa911067c">
          Tip here
        </Button>
      ],
    };
  };

  // Define Share URL
  const shareText = encodeURIComponent(
    `🔍 Curious about your Moxie? All stats revealed here! 
    frame by @0xdexter Tip for awesomeness`
  );

  const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=https://moxie-stat.vercel.app/frames${
    fid ? `?userfid=${fid}` : ""
  }`;

  // Define Buttons
  const buttons = [];

  if (!userData) {
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
  } else {
    buttons.push(
      <Button action="link" target={shareUrl}>
        Share
      </Button>,
      <Button action="link" target="https://warpcast.com/0xdexter/0xa911067c">
        Tip here
      </Button>
    );
  }

  return fid && !error
    ? {
        ...ActivityScreen(),
        buttons: buttons,
      }
    : {
        ...SplashScreen(),
        state: { lastFid: fid },
      };
});

export const GET = frameHandler;
export const POST = frameHandler;