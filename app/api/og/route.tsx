import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';



function parseNumber(value: string): number {
  if (value.endsWith('K')) {
    return parseFloat(value) * 1000;
  } else if (value.endsWith('M')) {
    return parseFloat(value) * 1000000;
  }
  return parseFloat(value);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toFixed(2);
  }
}

const interBoldFont = fetch(
    new URL('../../assets/Inter-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const interSemiBoldFont = fetch(
    new URL('../../assets/Inter-SemiBold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const interExtraBoldFont = fetch(
    new URL('../../assets/Inter-ExtraBold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const interRegularFont = fetch(
    new URL('../../assets/Inter-Regular.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const jerseyFont = fetch(
    new URL('../../assets/Jersey-Regular.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const leagueSpartanFont = fetch(
    new URL('../../assets/LeagueSpartan.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const spaceMonoFont = fetch(
    new URL('../../assets/SpaceMono-Regular.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

const spaceMonoBoldFont = fetch(
    new URL('../../assets/SpaceMono-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
  
    const error = searchParams.get('e');
    if (error) {
      return new ImageResponse(
        (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#1E40AF', 
            color: 'white', 
            fontFamily: 'sans-serif',
            padding: '40px'
          }}>
            <h1 style={{ fontSize: '32px', textAlign: 'center' }}>{error}</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }
  
    const userData = {
      name: searchParams.get('n') || 'Unknown',
      username: searchParams.get('u') || 'unknown',
      fid: searchParams.get('f') || 'N/A',
      profileImageUrl: searchParams.get('p') || '',
      farcasterScore: searchParams.get('s') || '0',
      farcasterRank: searchParams.get('r') || '0',
      followers: searchParams.get('fl') || '0',
      farcasterAge: searchParams.get('a') || '0Y 0M 0D',
      farcasterStatus: searchParams.get('st') || 'Rising Star',
      farcasterAgePercentile: searchParams.get('ap') || '0',
      firstCastDate: searchParams.get('fd') || 'N/A',
      totalCasts: searchParams.get('tc') || '0'
    };
  
    const profileImage = userData.profileImageUrl
      ? { src: decodeURIComponent(userData.profileImageUrl) }
      : { src: 'https://placehold.co/600x400' };
  
    const backgroundImageUrl = 'https://uqmhcw5knmkdj4wh.public.blob.vercel-storage.com/ne%20bg%20col-eYFN0FiBMNrFj0mAxOShk5SUTer7a7.png';
  
    return new ImageResponse(
      (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '1146px', 
          height: '630px', 
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          color: 'white', 
          fontFamily: 'sans-serif',
          padding: '40px'
        }}>

            
          <div style={{ display: 'flex', alignItems: 'center', margin: '0', justifyContent: 'center', marginTop: '110px', paddingLeft: '20px', paddingRight: '20px', marginLeft: '20px', marginRight: '50px', marginBottom: '-20px', position: 'relative', bottom: '20px', top: '-20px' }}>
            <div style={{ display: 'flex', position: 'relative', width: '100px', height: '100px', margin: '20px', marginBottom: '40px' }}>
              <img
                src={profileImage.src}
                alt="Profile"
                style={{ width: '100px', height: '100px', borderRadius: '50px' }}
                width={100}
                height={100}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column',  margin: 'auto', fontFamily: 'space mono', position: 'relative', bottom: '10px', top: '-10px' }}>
              <h2 style={{ fontSize: '35px', margin: '0', textAlign: 'start', padding: '0', marginBottom: '1px' }}>
                  {userData.name.length > 13 ? userData.name.split(' ')[0] : userData.name} 
              </h2>
              <p style={{ fontSize: '25px', margin: '0', textAlign: 'start', padding: '0', marginTop: '2px' }}>@{userData.username}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', margin: '0' }}>
              <p style={{ fontFamily: 'Space Mono',  fontSize: '25px', margin: '0', marginBottom: '5px'}}>FID: {userData.fid}</p>
              <p style={{ fontFamily: 'Space Mono', fontSize: '25px', margin: '0', marginBottom: '5px'}}>Followers: {formatNumber(parseFloat(userData.followers))}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', margin: 'auto' }}>
              <p style={{ fontFamily: 'Space Mono', fontSize: '25px', margin: '0', marginBottom: '5px' }}>Far Score: {formatNumber(parseFloat(userData.farcasterScore))}</p>
              <p style={{ fontFamily: 'Space Mono', fontSize: '25px', margin: '0', marginBottom: '5px' }}>Far Rank: {userData.farcasterRank}</p>
            </div>

          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px', marginLeft: '50px', marginRight: '50px',  marginTop: '5px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', margin: 'auto', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '100px', paddingRight: '100px', alignItems: 'center' }}>
              
              <p style={{ fontFamily: 'Space Mono', fontSize: '35px', margin: 'auto', marginBottom: '5px' }}>Farcaster Age</p>
              <p style={{  fontSize: '50px', fontWeight: 'bold' }}>{userData.farcasterAge}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', margin: 'auto', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '100px', paddingRight: '100px', alignItems: 'center' }}>
              <p style={{ fontFamily: 'Space Mono', fontSize: '35px', margin: 'auto', marginBottom: '5px' }}>Farcaster Status</p>
              <p style={{  fontSize: '50px', fontWeight: 'bold' }}>{userData.farcasterStatus}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: 'auto', marginTop: '5px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', margin: 'auto', paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px', alignItems: 'center' }}>
              <p style={{ fontFamily: 'Space Mono', fontSize: '35px', margin: 'auto', textAlign: 'center' }}>Age Percentile</p>
              <p style={{  fontSize: '80px', fontWeight: 'bold', textAlign: 'center', margin: '0px', paddingBottom: '5px' }}>{userData.farcasterAgePercentile} %</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'start', margin: 'auto', paddingLeft: '20px', paddingRight: '10px' }}>
              <p style={{ fontFamily: 'Space Mono', fontSize: '35px', margin: 'auto', textAlign: 'start' }}>Joined On</p>
              <p style={{  fontSize: '50px', fontWeight: 'bold', margin: '5px', textAlign: 'start' }}>{userData.firstCastDate}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'start', margin: 'auto', paddingLeft: '25px', paddingRight: '30px' }}>
              <p style={{ fontFamily: 'Space Mono', fontSize: '32px', margin: 'auto', textAlign: 'start' }}>Total Casts</p>
              <p style={{ fontSize: '50px', fontWeight: 'bold', margin: '5px', textAlign: 'start' }}>{formatNumber(parseFloat(userData.totalCasts))}</p>
            </div>
          </div>
        </div>
      ),
      {
        width: 1146,
        height: 630,
        fonts: [
          {
            name: 'League Spartan',
            data: await leagueSpartanFont,
            weight: 700,
          },
          {
            name: 'Space Mono',
            data: await spaceMonoFont,
            weight: 400,
          },
          {
            name: 'Space Mono',
            data: await spaceMonoBoldFont,
            weight: 700,
          },
        ],
      }
    );
  } 
