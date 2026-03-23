import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 10; // Cache for 10 seconds only - no force-dynamic!

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const STACKS_API = process.env.NEXT_PUBLIC_STACKS_API || 'https://api.testnet.hiro.so';
    const url = `${STACKS_API}/extended/v1/address/${address}/balances`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout and cache
      next: { revalidate: 10 }
    });

    if (!response.ok) {
      // If rate limited, return graceful error
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limited',
            stx: { balance: '0', locked: '0' }
          },
          { status: 200 } // Return 200 so app doesn't crash
        );
      }
      
      throw new Error(`Hiro API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', stx: { balance: '0', locked: '0' } },
      { status: 200 } // Return 200 with default data
    );
  }
}