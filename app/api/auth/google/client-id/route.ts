import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Google Client ID is not configured yet. Please complete OAuth setup in AI Studio.' }, { status: 500 });
    }
    return NextResponse.json({ clientId });
  } catch (error: any) {
    console.error('Error fetching Google Client ID:', error);
    return NextResponse.json({ error: 'Failed to fetch client ID' }, { status: 500 });
  }
}
