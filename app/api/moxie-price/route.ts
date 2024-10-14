import { NextResponse } from 'next/server';
import Moralis from 'moralis';

let moralisInitialized = false;

async function initializeMoralis() {
  if (!moralisInitialized) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY
    });
    moralisInitialized = true;
  }
}

export async function GET() {
  try {
    await initializeMoralis();

    const response = await Moralis.EvmApi.token.getTokenPrice({
      "chain": "0x2105",
      
      "address": "0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527"
    });

    return NextResponse.json({
      usdPrice: response.raw.usdPrice,
      usdPriceFormatted: response.raw.usdPriceFormatted,
      '24hrPercentChange': response.raw['24hrPercentChange']
    });
  } catch (error) {
    console.error('Error fetching Moxie price:', error);
    return NextResponse.json({
      usdPrice: 0.002713797027076074,
      usdPriceFormatted: '0.002713797027076074',
      '24hrPercentChange': '0'
    }, { status: 500 });
  }
}