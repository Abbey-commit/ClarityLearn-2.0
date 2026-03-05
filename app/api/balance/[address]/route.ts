// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API || 'https://api.testnet.hiro.so';

// In Next.js 15+, params is a Promise and must be awaited
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  // CRITICAL: await params in Next.js 15+
  const { address } = await params;
  
  console.log('📡 API Route: Fetching balance for', address);
  
  try {
    const apiUrl = `${STACKS_API_URL}/extended/v1/address/${address}/stx`;
    console.log('📡 Calling Hiro API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Don't cache balance data
    });

    if (!response.ok) {
      console.error('❌ Hiro API error:', response.status);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      
      return NextResponse.json(
        { error: `Hiro API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Balance fetched successfully:', data);
    
    // Return with CORS headers to allow frontend access
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('❌ Error in balance API route:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch balance', stack: error.stack },
      { status: 500 }
    );
  }
}