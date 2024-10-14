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

  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
  
    const error = searchParams.get('error');
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
      name: searchParams.get('name') || 'Unknown',
      username: searchParams.get('username') || 'unknown',
      fid: searchParams.get('fid') || 'N/A',
      totalCasts: searchParams.get('totalCasts') || '0',
      totalComments: searchParams.get('totalComments') || '0',
      totalReactions: searchParams.get('totalReactions') || '0',
      firstCastDate: searchParams.get('firstCastDate') || 'N/A',
      daysRegistered: searchParams.get('daysRegistered') || '0',
      farcasterScore: searchParams.get('farcasterScore') || '0',
      farcasterRank: searchParams.get('farcasterRank') || '0',
      profileImageUrl: searchParams.get('profileImageUrl') || '',
      followers: searchParams.get('followers') || '0',
    };
  
    const profileImage = userData.profileImageUrl
      ? { src: decodeURIComponent(userData.profileImageUrl) }
      : { src: 'https://example.com/default-profile-image.png' };
  
    const backgroundImageUrl = 'https://uqmhcw5knmkdj4wh.public.blob.vercel-storage.com/Your%20Activity%20(1)-3IzgWgNqOQLn5Lf8ua6TQxkoz7OJQj.png';
  
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

            
          <div style={{ display: 'flex', alignItems: 'center', margin: ' auto',justifyContent:'center',marginTop:'110px',marginBottom:'40px' }}>
            <div style={{display:'flex',position:'relative',width:'100px',height:'100px',marginRight:'20px'}}>
            <img 
              src={profileImage.src}
              alt="Profile" 
              style={{ width: '100px', height: '100px', borderRadius: '50px' }}
              width={90}
              height={90}
            />   
            </div>
             <div style={{ display:'flex',flexDirection:'column',textAlign:'start',margin:'auto',fontFamily:'League Spartan',marginRight:'70px' }}> 
              <h2 style={{ fontSize: '40px', margin: '0' }}>
                {userData.name.length > 15 ? userData.name.split(' ')[0] : userData.name}
              </h2>
              <p style={{ fontSize: '30px', margin: '0' }}>@{userData.username}</p>
             </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left',margin: '0',marginRight:'50px' }}>
               <p style={{fontSize:'35px',margin:'0',paddingBottom:'10px'}}>FID: {userData.fid}</p>
               <p style={{fontSize:'35px',margin:'0',paddingBottom:'10px'}}>Followers: {userData.followers}</p>
            </div>
             
           <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', margin: 'auto',marginLeft:'20px' }}>
              <p style={{fontSize:'35px',margin:'0',marginBottom:'5px'}}>Far Score: {formatNumber(parseFloat(userData.farcasterScore))}</p>
              <p style={{fontSize:'35px',margin:'0',marginBottom:'5px'}}>Far Rank: {userData.farcasterRank}</p>
            </div>
             
          </div> 
          <div style={{ display: 'flex', justifyContent: 'space-between',marginBottom:'5px',marginLeft:'100px',marginRight:'100px',textAlign:'center',marginTop:'5px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center',margin: 'auto',paddingTop:'10px',paddingBottom:'10px',paddingLeft:'100px',paddingRight:'100px',alignItems:'center' }}>
             <p style={{fontSize:'35px',margin:'auto',marginBottom:'5px'}}>Total Casts</p>
              <p style={{ fontSize: '90px', fontWeight: 'bold',  }}>{userData.totalCasts}</p> 
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center',margin: 'auto',paddingTop:'10px',paddingBottom:'10px',paddingLeft:'100px',paddingRight:'100px',alignItems:'center' }}>
             <p style={{fontSize:'35px',margin:'auto',marginBottom:'5px'}}>Total Replies</p>
              <p style={{ fontSize: '90px', fontWeight: 'bold' }}>{userData.totalComments}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center',margin: 'auto',paddingTop:'10px',paddingBottom:'10px',paddingLeft:'100px',paddingRight:'100px',alignItems:'center' }}>
             <p style={{fontSize:'35px',margin:'auto',marginBottom:'5px'}}>Total Reactions</p>
              <p style={{ fontSize: '90px', fontWeight: 'bold' }}>{userData.totalReactions}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between',flex: 1,marginLeft:'100px',marginRight:'150px',marginTop:'15px',marginBottom:'5px',textAlign:'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: '35px', margin: 'auto' }}>First Cast Date</p>
              <p style={{ fontSize: '70px', fontWeight: 'bold', margin: '10px 0' }}>{userData.firstCastDate}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <p style={{ fontSize: '35px', margin: 'auto' }}>Days Since Registered</p>
              <p style={{ fontSize: '70px', fontWeight: 'bold', margin: '10px 0' }}>{userData.daysRegistered} DAYS</p>
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
        ],
      }
    );
  }