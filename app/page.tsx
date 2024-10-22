import { fetchMetadata } from "frames.js/next";
import { appURL } from "./utils";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { userfid?: string };
}) {
  const framesUrl = new URL("/frames", appURL());
  const fid = searchParams.userfid;

  if (searchParams.userfid) {
    framesUrl.searchParams.set("userfid", searchParams.userfid);
    framesUrl.searchParams.set("action", "fetch");
  }

  // Create OG image URL with parameters
  const ogImageUrl = new URL(`${appURL()}/api/og`);
  if (fid) {
    // Fetch user data first
    const userDataResponse = await fetch(`${appURL()}/api/farscore?userId=${fid}`);
    const userData = await userDataResponse.json();
    
    if (userData && userData.userInfo) {
      ogImageUrl.searchParams.append('n', userData.userInfo.profileDisplayName || 'Unknown');
      ogImageUrl.searchParams.append('u', userData.userInfo.profileHandle || 'unknown');
      ogImageUrl.searchParams.append('f', fid);
      ogImageUrl.searchParams.append('p', userData.userInfo.profileImageContentValue?.image?.small || '');
      ogImageUrl.searchParams.append('s', userData.userInfo.farcasterScore?.farScore || '0');
      ogImageUrl.searchParams.append('r', userData.userInfo.farcasterScore?.farRank || '0');
      ogImageUrl.searchParams.append('fl', userData.userInfo.followerCount || '0');
      ogImageUrl.searchParams.append('tc', userData.totalCasts || '0');
    }
  }

  return {
    title: "Farcaster Activity Summary",
    description: "Check out my Farcaster activity!",
    openGraph: {
      title: "Farcaster Activity Summary",
      description: "Check out my Farcaster activity!",
      images: [ogImageUrl.toString()],
    },
    other: {
      ...(await fetchMetadata(framesUrl)),
    },
  };
}

export default function Page() {
  return <span></span>;
}
