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

  console.log("Fetching metadata from:", framesUrl.toString());

  const castActionUrl = new URL("/api/cast-action", appURL());

  return {
    title: "Farcaster Activity Summary",
    description: "Check out my Farcaster activity!",
    openGraph: {
      title: "Farcaster Activity Summary",
      description: "Check out my Farcaster activity!",
      images: [`${appURL()}/api/og`],
    },
    other: {
      ...(await fetchMetadata(framesUrl)),
      "fc:frame:cast_action:url": castActionUrl.toString(),
    },
  };
}

export default function Page() {
  return <span></span>;
}
