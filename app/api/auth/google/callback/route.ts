import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return new NextResponse(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: '${error}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication failed: ${error}. You can close this window.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!code) {
      return new NextResponse('Missing authorization code', { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new NextResponse('Google OAuth environment variables are missing on the server', { status: 500 });
    }

    let redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL}/api/auth/google/callback`
      : `${new URL(req.url).origin}/api/auth/google/callback`;

    redirectUri = redirectUri.replace(/([^:]\/)\/+/g, '$1');

    // Exchange code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to exchange authorization code for token:', data);
      const errMsg = data.error_description || data.error || 'Token exchange failed';
      return new NextResponse(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: '${errMsg}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication exchange failed. You can close this window.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const { access_token, refresh_token, expires_in } = data;

    // Send access token and refresh token (if available) back to parent window
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                tokens: {
                  accessToken: '${access_token || ''}',
                  refreshToken: '${refresh_token || ''}',
                  expiresAt: ${Date.now() + (expires_in || 3600) * 1000}
                }
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Gmail connection successful! This window will close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (err: any) {
    console.error('Error in Google Auth Callback API:', err);
    return new NextResponse(`Internal Server Error: ${err.message || String(err)}`, { status: 500 });
  }
}
