import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Google Client ID is not configured yet. Please complete OAuth setup in AI Studio.' }, { status: 500 });
    }

    // Determine redirect URI
    let redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL}/api/auth/google/callback`
      : `${new URL(req.url).origin}/api/auth/google/callback`;

    // Make sure redirect_uri doesn't have duplicate slashes (except after http:// or https://)
    redirectUri = redirectUri.replace(/([^:]\/)\/+/g, '$1');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent', // Required to force a refresh token to be returned
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({ url: googleAuthUrl });
  } catch (error: any) {
    console.error('Error in Google Auth URL API:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}
