import { Button } from "frames.js/next";
import React, { cache } from "react";
import { frames } from "./frames";
import { appURL, formatNumber } from "../utils";
import { NeynarAPIClient, ReactionsType } from "@neynar/nodejs-sdk";
import axios from 'axios';
import dotenv from 'dotenv';
import { unstable_cache } from 'next/cache';

dotenv.config();

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY || '');

interface State {
  lastFid?: string
}




const frameHandler = frames(async (ctx) => {
interface UserData {
  name: string;
  username: string;
  fid: string;
  profileDisplayName: string;
  profileHandle: string;
  profileImageUrl: string;
  totalCasts: number;
  totalLikesReceived: number;
  totalRecasts: number;
  totalReplies: number;
  totalRecastsReceived: number;
  firstCastDate: string;
  daysRegistered: number;
  farcasterScore: number;
  farcasterRank: number;
  followers: number;
  castFrequency: number;
  storageUsage: number;
  farcasterAge: string;
  farcasterAgePercentile: number;
  farcasterStatus: string;
}

  let userData: UserData | null = null;
  let error: string | null = null;
  let isLoading = false;

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
    const firstCastTimestamp = data.firstCastTimestamp;

    const firstCastDate = firstCastTimestamp 
      ? new Date(firstCastTimestamp * 1000).toISOString().split('T')[0] 
      : 'N/A';
    const daysRegistered = firstCastTimestamp 
      ? Math.floor((Date.now() - firstCastTimestamp * 1000) / (1000 * 60 * 60 * 24)) 
      : 0;

    // Calculate Farcaster age
    const years = Math.floor(daysRegistered / 365);
    const months = Math.floor((daysRegistered % 365) / 30);
    const days = daysRegistered % 30;
    const farcasterAge = years > 0 ? `${years}Y ${months}M ${days}D` : `${months}M ${days}D`;
    
    const farcasterAgePercentile = calculateFarcasterAgePercentile(daysRegistered);
    const totalCasts = data.totalCasts || 0;
    const followers = parseInt(userInfo.followerCount) || 0;
    const farcasterStatus = determineFarcasterStatus(farcasterAgePercentile, totalCasts, followers);

    const userData: UserData = {
      name: userInfo.profileDisplayName || 'Unknown',
      username: userInfo.profileHandle || 'unknown',
      fid,
      profileDisplayName: userInfo.profileDisplayName || 'Unknown',
      profileHandle: userInfo.profileHandle || 'unknown',
      profileImageUrl: userInfo.profileImageContentValue?.image?.small || 'https://i.imgur.com/UhV7H97.jpeg',
      totalCasts,
      totalRecasts: 0, // Not available from Neynar API
      totalReplies: 0, // Not available from Neynar API
      totalLikesReceived: 0, // We're not fetching this anymore
      totalRecastsReceived: 0, // Not available from Neynar API
      firstCastDate,
      daysRegistered,
      farcasterScore: userInfo.farcasterScore?.farScore || 0,
      farcasterRank: userInfo.farcasterScore?.farRank || 0,
      followers,
      castFrequency: data.castFrequency || 0,
      storageUsage: data.storageUsage || 0,
      farcasterAge,
      farcasterAgePercentile,
      farcasterStatus,
    };

    return userData;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Function to calculate Farcaster age percentile
const calculateFarcasterAgePercentile = (daysRegistered: number): number => {
  const farcasterLaunchDate = new Date('2021-01-01').getTime();
  const now = Date.now();
  const totalDaysSinceLaunch = Math.floor((now - farcasterLaunchDate) / (1000 * 60 * 60 * 24));
  
  const percentile = (daysRegistered / totalDaysSinceLaunch) * 100;
  
  return Math.min(100, Math.max(0, Math.round(percentile)));
};

// Function to determine Farcaster status
const determineFarcasterStatus = (agePercentile: number, totalCasts: number, followers: number): string => {
  const engagementScore = Math.log10(totalCasts + 1) * Math.log10(followers + 1);

  if (agePercentile > 85 && engagementScore > 10) return "Legendary Pioneer";
  if (agePercentile > 80 && engagementScore > 9) return "Esteemed Elder";
  if (agePercentile > 60 && engagementScore > 8) return "Seasoned Caster";
  if (agePercentile > 40 && engagementScore > 6) return "Established Resident";
  if (agePercentile > 20 && engagementScore > 4) return "Active Participant";
  return "Rising Star";
};

const generateShareText = (userData: UserData | null): string => {
  if (!userData) return '';
  
  return encodeURIComponent(
    `🌟 Just discovered I'm a ${userData.farcasterStatus} on Farcaster! ${
      userData.farcasterStatus === "Legendary Pioneer" 
        ? "Been here since day one! 🏆" 
        : userData.farcasterStatus === "Esteemed Elder" 
        ? "Walking the path since early days! 👑" 
        : userData.farcasterStatus === "Seasoned Caster" 
        ? "Building my legacy on Farcaster! 🌱" 
        : userData.farcasterStatus === "Established Resident" 
        ? "Making my mark on Farcaster! 💫" 
        : userData.farcasterStatus === "Active Participant" 
        ? "Growing strong in the Farcaster community! 🌿" 
        : "Starting my Farcaster journey! ⭐"
    }

Check your status with @0xdexter's Analytics Summary Frame!`
  );
};

const generateShareUrl = (userData: UserData | null, fid: string | null): string => {
  if (!userData || !fid) return '';
  
  // Create a clean base URL for 
  const baseUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    `🌟 Check out my Farcaster Activity Summary!\n\nI'm a ${userData.farcasterStatus} 🏆\n\nFrame by @0xdexter`
  )}`;

  // Add a clean frame URL as embed
  const frameUrl = `${appURL()}/frames?userfid=${fid}`;
  
  return `${baseUrl}&embeds[]=${encodeURIComponent(frameUrl)}`;
};

const generateCleanShareUrl = (fid: string): string => {
  const baseUrl = appURL();
  return `${baseUrl}/frames?userfid=${fid}`;
};

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



  // Define SplashScreen
  const SplashScreen = () => {
    const imageUrl = "https://uqmhcw5knmkdj4wh.public.blob.vercel-storage.com/initial-animation%20(1)-jjzKhumfRRBYsviIAiRuzwTlrX9AzI.gif";
    
    return {
      image: imageUrl,
      imageOptions: {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'public, max-age=31536000, immutable',
          'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      buttons: [
        <Button action="post" target={{ href: `${appURL()}` }}>
          Check Me
        </Button>
      ],
      input: {
        text: "Enter your FID",
      },
    };
  };

  // Define ActivityScreen
  const ActivityScreen = () => {
    if (!userData) {
      return {
        image: `${appURL()}/api/og?e=${encodeURIComponent(error || "User data not available")}`,
        buttons: [
          <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
            Refresh
          </Button>
        ]
      };
    }

    const ogImageUrl = new URL(`${appURL()}/api/og`);
    ogImageUrl.searchParams.append('n', userData.name);
    ogImageUrl.searchParams.append('u', userData.username);
    ogImageUrl.searchParams.append('f', userData.fid);
    ogImageUrl.searchParams.append('p', userData.profileImageUrl);
    ogImageUrl.searchParams.append('s', userData.farcasterScore.toString());
    ogImageUrl.searchParams.append('r', userData.farcasterRank.toString());
    ogImageUrl.searchParams.append('fl', userData.followers.toString());
    ogImageUrl.searchParams.append('a', userData.farcasterAge);
    ogImageUrl.searchParams.append('st', userData.farcasterStatus);
    ogImageUrl.searchParams.append('ap', userData.farcasterAgePercentile.toString());
    ogImageUrl.searchParams.append('fd', userData.firstCastDate);
    ogImageUrl.searchParams.append('tc', userData.totalCasts.toString());
    
    const shareUrl = generateShareUrl(userData, fid);
    
    return {
      image: ogImageUrl.toString(),
      buttons: [
        <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
          Refresh
        </Button>,
        <Button action="link" target={shareUrl}>
          Share
        </Button>,
        <Button action="link" target="https://warpcast.com/0xdexter/0xa911067c">
          Tip here
        </Button>
      ]
    };
  };

  return fid && !error ? ActivityScreen() : SplashScreen();
});

export const GET = frameHandler;
export const POST = frameHandler;













