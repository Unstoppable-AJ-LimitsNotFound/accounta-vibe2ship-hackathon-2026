import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonParseErr: any) {
      return NextResponse.json({ error: 'Invalid request body. Expected a valid JSON object.' }, { status: 400 });
    }

    const { 
      accessToken: inputAccessToken, 
      refreshToken, 
      partnerName, 
      partnerEmail, 
      userName, 
      completedHabits, 
      missedHabits 
    } = body;

    if (!partnerEmail) {
      return NextResponse.json({ error: 'Missing partner email' }, { status: 400 });
    }

    let accessToken = inputAccessToken;

    // 1. Attempt to refresh Google Access Token if a refresh token is provided
    if (refreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }).toString(),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.access_token) {
            accessToken = refreshData.access_token;
          }
        } else {
          console.error('Google token refresh failed:', await refreshResponse.text());
        }
      } catch (refreshErr: any) {
        console.error('Error while refreshing Google token:', refreshErr);
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'No Google Access Token is available. Please connect your Gmail in Settings.' }, { status: 401 });
    }

    // 2. Generate custom Gemini message
    const completedStr = completedHabits && completedHabits.length > 0 
      ? completedHabits.map((h: any) => `• ${h.emoji || '✨'} ${h.name}`).join('\n') 
      : '(None)';

    const missedStr = missedHabits && missedHabits.length > 0 
      ? missedHabits.map((h: any) => `• ${h.emoji || '✨'} ${h.name}`).join('\n') 
      : '(None)';

    const totalCount = (completedHabits?.length || 0) + (missedHabits?.length || 0);
    const completedCount = completedHabits?.length || 0;

    const prompt = `You are Accounta, an AI-powered habit accountability coach. The user ${userName || 'User'} is being monitored by their accountability partner ${partnerName || 'Friend'}. Today's stats for ${userName || 'User'}:
Completed:
${completedStr}

Missed:
${missedStr}

Generate a concise, professional, yet sharp and direct accountability analysis message to be sent to ${partnerName || 'Partner'}. Be honest, motivational, but firm (or shaming if they missed their goals). Keep it under 150 words and do not use markdown formatting or place-holders like [Partner Name].`;

    let aiMessage = '';
    const maxRetries = 3;
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is not configured on the server. Please configure it in Settings.');
        }

        // Lazy-instantiate the GoogleGenAI client to prevent top-level initialization errors
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
        aiMessage = response.text || '';
        break; // Success, exit retry loop!
      } catch (geminiErr: any) {
        const errMessage = String(geminiErr.message || geminiErr);
        const is503 = errMessage.includes('503') || geminiErr.status === 503 || geminiErr.status === '503' || geminiErr.statusCode === 503;

        if (is503 && attempt < maxRetries) {
          attempt++;
          console.warn(`Gemini API call failed with 503. Retrying attempt ${attempt}/${maxRetries} in 2 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          console.error('Failed to generate email message via Gemini after retries:', geminiErr);
          return NextResponse.json({
            error: `Gemini API Call failed: ${geminiErr.message || 'Unknown Gemini error'}`
          }, { status: 500 });
        }
      }
    }

    // 3. Construct beautiful responsive HTML email
    const scoreColor = completedCount === totalCount ? '#10b981' : completedCount > 0 ? '#f59e0b' : '#ef4444';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Accounta Daily Habit Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
            .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { background-color: #09090b; padding: 28px 24px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.05em; font-family: monospace; }
            .content { padding: 32px 24px; }
            .greeting { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #111827; }
            .intro { font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 24px; }
            .stats-badge { display: inline-block; padding: 6px 14px; font-size: 14px; font-weight: 800; border-radius: 20px; color: #ffffff; margin-bottom: 24px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
            .habit-list { list-style: none; padding: 0; margin: 0 0 24px 0; }
            .habit-item { display: flex; align-items: center; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f9fafb; }
            .habit-emoji { font-size: 18px; margin-right: 10px; width: 24px; text-align: center; }
            .habit-name { font-weight: 500; color: #374151; }
            .habit-completed { color: #10b981; font-weight: bold; margin-left: auto; font-size: 12px; }
            .habit-missed { color: #ef4444; font-weight: bold; margin-left: auto; font-size: 12px; }
            .ai-block { background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px 8px 8px 4px; padding: 18px; margin-bottom: 28px; }
            .ai-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #4f46e5; margin-bottom: 8px; }
            .ai-text { font-size: 14px; line-height: 1.6; font-style: italic; color: #334155; }
            .footer { background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="logo">Accounta</span>
            </div>
            <div class="content">
              <div class="greeting">Hello ${partnerName || 'Accountability Partner'},</div>
              <p class="intro">
                You are receiving this automated report because you are the accountability partner for <strong>${userName || 'User'}</strong>.
                Here is their habit tracking completion scorecard for today.
              </p>
              
              <div class="stats-badge" style="background-color: ${scoreColor};">
                Completed ${completedCount} of ${totalCount} habits (${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%)
              </div>

              ${completedHabits && completedHabits.length > 0 ? `
                <div class="section-title">Completed Habits</div>
                <ul class="habit-list">
                  ${completedHabits.map((h: any) => `
                    <li class="habit-item">
                      <span class="habit-emoji">${h.emoji || '✔️'}</span>
                      <span class="habit-name">${h.name}</span>
                      <span class="habit-completed">COMPLETED</span>
                    </li>
                  `).join('')}
                </ul>
              ` : ''}

              ${missedHabits && missedHabits.length > 0 ? `
                <div class="section-title">Missed Habits</div>
                <ul class="habit-list">
                  ${missedHabits.map((h: any) => `
                    <li class="habit-item">
                      <span class="habit-emoji">${h.emoji || '❌'}</span>
                      <span class="habit-name">${h.name}</span>
                      <span class="habit-missed">MISSED</span>
                    </li>
                  `).join('')}
                </ul>
              ` : ''}

              <div class="ai-block">
                <div class="ai-title">AI Accountability Coach Analysis</div>
                <div class="ai-text">"${aiMessage}"</div>
              </div>
            </div>
            <div class="footer">
              This report was automatically triggered by Accounta. Real consequences enforce habit completion.
            </div>
          </div>
        </body>
      </html>
    `;

    // 4. Send email via Google Gmail API
    const emailSubject = `Accounta Daily Report: ${userName || 'User'} completed ${completedCount}/${totalCount} habits`;
    const emailContent = [
      `To: ${partnerEmail}`,
      `Subject: ${emailSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\r\n');

    // Base64url encoding (MANDATORY for Gmail API)
    const rawMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    let gmailRes;
    try {
      gmailRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawMessage })
      });
    } catch (gmailFetchErr: any) {
      console.error('Failed to connect to Gmail API endpoint:', gmailFetchErr);
      return NextResponse.json({
        error: `Failed to reach Google Gmail API: ${gmailFetchErr.message || 'Network/connection failure'}`
      }, { status: 502 });
    }

    let gmailData: any;
    try {
      const contentType = gmailRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        gmailData = await gmailRes.json();
      } else {
        const textResponse = await gmailRes.text();
        console.error('Gmail API returned non-JSON response:', textResponse);
        return NextResponse.json({
          error: `Google Gmail API returned a non-JSON response with status code ${gmailRes.status}.`,
          details: textResponse
        }, { status: 502 });
      }
    } catch (parseErr: any) {
      console.error('Failed to parse Gmail response as JSON:', parseErr);
      return NextResponse.json({
        error: `Could not parse response from Google Gmail API (status ${gmailRes.status}).`,
        details: parseErr.message
      }, { status: 502 });
    }

    if (!gmailRes.ok) {
      console.error('Gmail API returned error status:', gmailRes.status, gmailData);
      return NextResponse.json({ 
        error: gmailData.error?.message || `Gmail API returned error code ${gmailRes.status}.`,
        details: gmailData 
      }, { status: gmailRes.status });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: gmailData.id, 
      aiMessage,
      newAccessToken: accessToken !== inputAccessToken ? accessToken : undefined 
    });
  } catch (error: any) {
    console.error('Unhandled error in send-report API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
