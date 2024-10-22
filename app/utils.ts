import { headers } from "next/headers";

export function currentURL(pathname: string): URL {
  try {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "http";

    return new URL(pathname, `${protocol}://${host}`);
  } catch (error) {
    console.error(error);
    return new URL("http://localhost:3000");
  }
}

export function appURL(): string {
  const customAppUrl = process.env.APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (customAppUrl) {
    return customAppUrl.startsWith('http') ? customAppUrl : `https://${customAppUrl}`;
  } else if (vercelUrl) {
    return `https://${vercelUrl}`;
  } else if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  } else {
    console.warn('Unable to determine app URL, using fallback');
    return 'https://analytics-summary.vercel.app/';
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toFixed(2);
  }
}