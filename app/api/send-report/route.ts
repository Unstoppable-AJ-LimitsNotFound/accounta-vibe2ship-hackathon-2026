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
      missedHabits,
      skippedHabits,
      isMilestone,
      milestoneCount,
      habitName,
      isCriticalAlert,
      isTenHourReminder
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

    let htmlContent = '';
    let emailSubject = '';
    let aiMessage = '';

    if (isMilestone) {
      emailSubject = `${userName || 'User'} just hit a ${milestoneCount}-day streak on ${habitName}! 🎉`;
      const logoUrl = 'https://accounta-vibe2ship-2026-388308312011.us-west1.run.app/Accounta_full_logo.png';
      
      let badgeSize = 22;
      let badgePadding = '12px 24px';
      let containerBorder = '1px solid #e5e7eb';
      let extraDecorationsTop = '';
      let extraDecorationsBottom = '';
      let congratsHeading = '';
      let congratsMessage = '';
      let cardBackground = '#ffffff';

      if (milestoneCount === 7) {
        badgeSize = 22;
        badgePadding = '12px 26px';
        congratsHeading = 'Incredible Start! 🎉';
        congratsMessage = 'They have successfully completed 7 consecutive days. The foundation of this habit is officially laid! Keep cheering them on.';
        extraDecorationsTop = `
          <div style="font-size: 28px; margin-bottom: 15px; letter-spacing: 4px;">🎉 ✨ 🔥</div>
        `;
      } else if (milestoneCount === 21) {
        badgeSize = 26;
        badgePadding = '14px 30px';
        congratsHeading = 'Phenomenal 21-Day Habit Locked! 💪';
        congratsMessage = '21 days of unbroken dedication. What started as an effort has officially become a solid daily routine! They are forming true lifestyle changes.';
        extraDecorationsTop = `
          <div style="font-size: 32px; margin-bottom: 16px; letter-spacing: 6px;">🎉 ✨ 🔥 💪 🔥 ✨ 🎉</div>
        `;
        extraDecorationsBottom = `
          <div style="margin-top: 24px; font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.12em;">
            ⚡ THREE WEEKS UNBROKEN ⚡
          </div>
        `;
      } else if (milestoneCount === 66) {
        badgeSize = 30;
        badgePadding = '16px 36px';
        congratsHeading = 'Behavioral Transformation Complete! ⚡';
        congratsMessage = '66 days! Scientifically, this is the milestone where a behavior transfers into automatic habit territory. They have successfully reprogrammed their daily default behavior!';
        extraDecorationsTop = `
          <div style="font-size: 36px; margin-bottom: 18px; letter-spacing: 10px;">🎉 ✨ 🔥 🔮 🔥 ✨ 🎉</div>
        `;
        extraDecorationsBottom = `
          <div style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-top: 24px; text-align: left;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #166534; margin-bottom: 4px;">🚀 SCIENTIFIC MILESTONE UNLOCKED</div>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #14532d; font-weight: 600;">
              Studies show 66 days is the average time it takes for a new habit to become fully automatic. They have successfully integrated this into their lifestyle!
            </p>
          </div>
          <div style="margin-top: 20px; font-size: 32px; letter-spacing: 8px;">🎉 🔥 ✨ 🔥 🎉</div>
        `;
      } else if (milestoneCount >= 100) {
        badgeSize = 36;
        badgePadding = '20px 42px';
        congratsHeading = 'THE CENTURY CLUB: 100-DAY LEGEND! 🏆';
        congratsMessage = '100 DAYS CONSECUTIVE! This is an elite level of self-mastery that only a tiny fraction of people ever achieve. Unbreakable commitment. Absolute legend status.';
        containerBorder = '2.5px solid #fbbf24';
        cardBackground = '#fffdf5';
        extraDecorationsTop = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 40px; margin-bottom: 10px; letter-spacing: 12px;">🏆 👑 🌟 👑 🏆</div>
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; color: #b45309; background-color: #fef3c7; display: inline-block; padding: 4px 12px; border-radius: 4px;">ELITE CENTURY CLUB</div>
          </div>
        `;
        extraDecorationsBottom = `
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px dashed #f59e0b; border-radius: 16px; padding: 22px; margin-top: 28px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.15); text-align: center;">
            <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #b45309; margin-bottom: 6px;">👑 THE ULTIMATE MILESTONE 👑</div>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f; font-weight: 800;">
              They conquered 100 days without a single slip. This requires mental fortitude, discipline, and unstoppable grit. You should be exceptionally proud of them!
            </p>
          </div>
          <div style="margin-top: 24px; font-size: 36px; letter-spacing: 12px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
            💎 ✨ 🔥 👑 🔥 ✨ 💎
          </div>
        `;
      } else {
        badgeSize = 22;
        badgePadding = '12px 24px';
        congratsHeading = 'Streak Milestone Achieved! 🎉';
        congratsMessage = 'They hit an incredible streak of consecutive completions! Thank you for holding them accountable.';
        extraDecorationsTop = `
          <div style="font-size: 24px; margin-bottom: 12px; letter-spacing: 4px;">🎉 ✨ 🔥</div>
        `;
      }

      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Milestone Celebration!</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
              .container { max-width: 580px; margin: 0 auto; background-color: ${cardBackground}; border: ${containerBorder}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
              .header { background-color: #000000; padding: 24px; text-align: center; }
              .logo-img { height: 44px; width: auto; max-width: 100%; display: inline-block; vertical-align: middle; }
              .content { padding: 36px 24px; text-align: center; }
              .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #111827; }
              .badge { display: inline-block; padding: ${badgePadding}; font-size: ${badgeSize}px; font-weight: 900; border-radius: 50px; background: linear-gradient(135deg, #ff782d 0%, #ffba26 100%); color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.15); box-shadow: 0 6px 18px rgba(255, 120, 45, 0.3); }
              .footer { background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Accounta Logo" class="logo-img" />
              </div>
              <div class="content">
                <div class="greeting">Hello ${partnerName || 'Accountability Partner'},</div>
                
                ${extraDecorationsTop}
                
                <div class="badge">🔥 ${milestoneCount}-Day Streak!</div>
                
                <div style="margin-top: 24px;">
                  <h1 style="font-size: 26px; font-weight: 900; color: #111827; margin: 0 0 12px 0; letter-spacing: -0.02em; line-height: 1.2;">
                    ${congratsHeading}
                  </h1>
                  <p style="font-size: 17px; line-height: 1.6; color: #1f2937; margin: 0 0 16px 0; font-weight: 700;">
                    ${userName || 'User'} just hit an amazing <strong>${milestoneCount}-day streak</strong> on their habit: <strong>${habitName}</strong>! 🎉
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; font-style: italic; font-weight: 500;">
                    ${congratsMessage}
                  </p>
                </div>

                <div style="background-color: #f0fdf4; background-color: rgba(240, 253, 244, 0.95); border: 1.5px solid rgba(34, 197, 94, 0.3); box-shadow: 0 0 15px rgba(34, 197, 94, 0.12); padding: 20px; border-radius: 12px; margin-top: 28px; text-align: center;">
                  <p style="color: #000000; font-size: 15px; font-weight: 800; margin: 0; line-height: 1.5;">
                    They wanted you to know &mdash; your support is part of why this is working.
                  </p>
                </div>

                ${extraDecorationsBottom}
              </div>
              <div class="footer">
                This report was automatically triggered by Accounta. Real consequences enforce habit completion.
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      // Check for custom EOD types
      const zeroCompleted = (completedHabits && completedHabits.length === 0 && missedHabits && missedHabits.length > 0);
      const triggerCritical = isCriticalAlert || zeroCompleted;

      const completedStr = completedHabits && completedHabits.length > 0 
        ? completedHabits.map((h: any) => `• ${h.emoji || '✨'} ${h.name}`).join('\n') 
        : '(None)';

      const missedStr = missedHabits && missedHabits.length > 0 
        ? missedHabits.map((h: any) => `• ${h.emoji || '✨'} ${h.name}`).join('\n') 
        : '(None)';

      const totalCount = (completedHabits?.length || 0) + (missedHabits?.length || 0);
      const completedCount = completedHabits?.length || 0;

      let prompt = '';
      if (isTenHourReminder) {
        emailSubject = `⏳ Urgent Reminder: Accountability breach unresolved for 10+ hours — ${userName || 'User'}`;
        prompt = `You are Accounta, an AI-powered habit accountability coach. The user ${userName || 'User'} triggered an accountability breach by missing their daily habits:
${missedStr}

It has been MORE THAN 10 HOURS and they still have not resolved the breach or completed their public shame action. Generate a firm, direct, and serious coaching message to their partner ${partnerName || 'Friend'}. Point out that dragging out the resolution or procrastinating on the consequences weakens their discipline. Recommend that the partner step in and demand immediate action. Keep it under 150 words and do not use markdown formatting.`;
      } else if (triggerCritical) {
        emailSubject = `⚠️ Critical Alert: Zero habits completed today — ${userName || 'User'}`;
        prompt = `You are Accounta, an AI-powered habit accountability coach. The user ${userName || 'User'} is being monitored by their accountability partner ${partnerName || 'Friend'}. TODAY, THE USER COMPLETED ABSOLUTELY ZERO HABITS. They failed on every single task:
${missedStr}

Generate an extremely stern, serious, and disappointed accountability coaching analysis message. Do not make excuses for them. Remind the partner that completing zero habits represents a complete collapse of discipline, and urge the partner to contact them immediately to enforce the agreed consequences. Keep it under 150 words and do not use markdown formatting.`;
      } else {
        emailSubject = `Accounta Daily Report: ${userName || 'User'} completed ${completedCount}/${totalCount} habits`;
        prompt = `You are Accounta, an AI-powered habit accountability coach. The user ${userName || 'User'} is being monitored by their accountability partner ${partnerName || 'Friend'}. Today's stats for ${userName || 'User'}:
Completed:
${completedStr}

Missed:
${missedStr}

Generate a concise, professional, yet sharp and direct accountability analysis message to be sent to ${partnerName || 'Partner'}. Be honest, motivational, but firm (or shaming if they missed their goals). Keep it under 150 words and do not use markdown formatting or place-holders like [Partner Name].`;
      }

      aiMessage = '';
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

      const logoUrl = 'https://accounta-vibe2ship-2026-388308312011.us-west1.run.app/Accounta_full_logo.png';

      if (isTenHourReminder) {
        // Render 10-hour reminder template
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Accounta Breach Reminder</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
                .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 2.5px solid #ea580c; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15); }
                .header { background-color: #000000; padding: 24px; text-align: center; }
                .logo-img { height: 44px; width: auto; max-width: 100%; display: inline-block; vertical-align: middle; }
                .content { padding: 36px 24px; text-align: center; }
                .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #111827; text-align: left; }
                .intro { font-size: 14.5px; line-height: 1.6; color: #374151; margin-bottom: 24px; text-align: left; }
                .badge { display: inline-block; padding: 10px 22px; font-size: 14px; font-weight: 900; border-radius: 50px; background: linear-gradient(135deg, #f97316 0%, #b91c1c 100%); color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.15); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); margin-bottom: 24px; }
                .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; text-align: left; }
                .habit-list { list-style: none; padding: 0; margin: 0 0 24px 0; text-align: left; }
                .habit-item { display: flex; align-items: center; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
                .habit-emoji { font-size: 18px; margin-right: 10px; width: 24px; text-align: center; }
                .habit-name { font-weight: 600; color: #374151; }
                .habit-missed { color: #dc2626; font-weight: 800; margin-left: auto; font-size: 11px; letter-spacing: 0.05em; }
                .ai-block { background-color: #fff7ed; border-left: 4px solid #ea580c; border-radius: 4px 8px 8px 4px; padding: 18px; margin-bottom: 28px; text-align: left; }
                .ai-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #c2410c; margin-bottom: 8px; }
                .ai-text { font-size: 14px; line-height: 1.6; font-style: italic; color: #431407; font-weight: 500; }
                .footer { background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src="${logoUrl}" alt="Accounta Logo" class="logo-img" />
                </div>
                <div class="content">
                  <div class="greeting">Hello ${partnerName || 'Accountability Partner'},</div>
                  
                  <div class="badge">⏳ 10+ HOUR UNRESOLVED BREACH</div>
                  
                  <p class="intro">
                    This is an urgent automated reminder. It has been <strong>more than 10 hours</strong> since <strong>${userName || 'User'}</strong> triggered an accountability breach by missing their daily habits, and the breach <strong>remains unresolved</strong>.
                  </p>

                  ${missedHabits && missedHabits.length > 0 ? `
                    <div class="section-title">Breached Habits</div>
                    <ul class="habit-list">
                      ${missedHabits.map((h: any) => `
                        <li class="habit-item">
                          <span class="habit-emoji">${h.emoji || '❌'}</span>
                          <span class="habit-name">${h.name}</span>
                          <span class="habit-missed">UNRESOLVED</span>
                        </li>
                      `).join('')}
                    </ul>
                  ` : ''}

                  <div class="ai-block">
                    <div class="ai-title">Coach Accounta Assessment</div>
                    <div class="ai-text">"${aiMessage}"</div>
                  </div>

                  <div style="background-color: #fff7ed; border: 1.5px solid #fed7aa; border-left: 5px solid #f97316; border-radius: 12px; padding: 20px; margin-top: 28px; text-align: left;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #9a3412; margin-bottom: 8px;">⏳ RESOLUTION DELAYED</div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7c2d12; font-weight: 600;">
                      The public shame overlay is still active on their screen, preventing them from accessing the tracker until they resolve it. If they are dodging their consequences, it is time for a direct intervention. Support them by holding the line!
                    </p>
                  </div>
                </div>
                <div class="footer">
                  This report was automatically triggered by Accounta. Real consequences enforce habit completion.
                </div>
              </div>
            </body>
          </html>
        `;
      } else if (triggerCritical) {
        // Render critical alert template (Zero habits completed today)
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Critical Accountability Warning</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
                .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 2.5px solid #dc2626; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.18); }
                .header { background-color: #000000; padding: 24px; text-align: center; }
                .logo-img { height: 44px; width: auto; max-width: 100%; display: inline-block; vertical-align: middle; }
                .content { padding: 36px 24px; text-align: center; }
                .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #111827; text-align: left; }
                .intro { font-size: 14.5px; line-height: 1.6; color: #374151; margin-bottom: 24px; text-align: left; }
                .badge { display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 900; border-radius: 50px; background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.15); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); margin-bottom: 24px; }
                .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; text-align: left; }
                .habit-list { list-style: none; padding: 0; margin: 0 0 24px 0; text-align: left; }
                .habit-item { display: flex; align-items: center; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
                .habit-emoji { font-size: 18px; margin-right: 10px; width: 24px; text-align: center; }
                .habit-name { font-weight: 600; color: #374151; }
                .habit-missed { color: #ef4444; font-weight: 800; margin-left: auto; font-size: 11px; letter-spacing: 0.05em; }
                .ai-block { background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px 8px 8px 4px; padding: 18px; margin-bottom: 28px; text-align: left; }
                .ai-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #991b1b; margin-bottom: 8px; }
                .ai-text { font-size: 14px; line-height: 1.6; font-style: italic; color: #7f1d1d; font-weight: 500; }
                .footer { background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src="${logoUrl}" alt="Accounta Logo" class="logo-img" />
                </div>
                <div class="content">
                  <div class="greeting">Hello ${partnerName || 'Accountability Partner'},</div>
                  
                  <div class="badge">🚨 CRITICAL ALERT: ZERO HABITS COMPLETED</div>
                  
                  <p class="intro">
                    You are receiving this critical automated warning because you are the accountability partner for <strong>${userName || 'User'}</strong>.
                    Today, they completed <strong>absolutely zero</strong> of their required habits. This is a severe breach of their commitment.
                  </p>

                  ${missedHabits && missedHabits.length > 0 ? `
                    <div class="section-title">Missed Habits (All)</div>
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
                    <div class="ai-title">Coach Accounta Assessment</div>
                    <div class="ai-text">"${aiMessage}"</div>
                  </div>

                  <div style="background-color: #fef2f2; border: 1.5px solid #fca5a5; border-left: 5px solid #ef4444; border-radius: 12px; padding: 20px; margin-top: 28px; text-align: left;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #991b1b; margin-bottom: 8px;">🚨 CRITICAL ACTION REQUIRED</div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7f1d1d; font-weight: 600;">
                      Zero habit completion means their public shame post has been activated. Please contact <strong>${userName || 'User'}</strong> immediately to verify they have posted their confession and to apply the real-world consequences you agreed upon. Do not let them off the hook!
                    </p>
                  </div>
                </div>
                <div class="footer">
                  This report was automatically triggered by Accounta. Real consequences enforce habit completion.
                </div>
              </div>
            </body>
          </html>
        `;
      } else {
        // Render normal EOD template
        const scoreColor = completedCount === totalCount ? '#10b981' : completedCount > 0 ? '#f59e0b' : '#ef4444';
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Accounta Daily Habit Report</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
                .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background-color: #000000; padding: 24px; text-align: center; }
                .logo-img { height: 44px; width: auto; max-width: 100%; display: inline-block; vertical-align: middle; }
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
                  <img src="${logoUrl}" alt="Accounta Logo" class="logo-img" />
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

                  ${skippedHabits && skippedHabits.length > 0 ? `
                    <div class="section-title">Skipped Habits</div>
                    <ul class="habit-list">
                      ${skippedHabits.map((h: any) => `
                        <li class="habit-item">
                          <span class="habit-emoji">${h.emoji || '⏭️'}</span>
                          <span class="habit-name">${h.name}</span>
                          <span style="color: #6b7280; font-weight: bold; margin-left: auto; font-size: 12px;">SKIPPED</span>
                        </li>
                      `).join('')}
                    </ul>
                  ` : ''}

                  <div class="ai-block">
                    <div class="ai-title">AI Accountability Coach Analysis</div>
                    <div class="ai-text">"${aiMessage}"</div>
                  </div>

                  ${missedHabits && missedHabits.length > 0 ? `
                    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin-top: 24px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #991b1b; margin-bottom: 6px;">⚠️ Important Accountability Warning</div>
                      <div style="font-size: 13px; line-height: 1.5; color: #7f1d1d;">
                        This is one of the most important parts of Accounta &mdash; please confirm directly with <strong>${userName || 'User'}</strong> that they have actually published their public accountability post. Don't rely on this email alone. Make sure they feel the weight of their slip and follow through.
                      </div>
                    </div>
                  ` : ''}
                </div>
                <div class="footer">
                  This report was automatically triggered by Accounta. Real consequences enforce habit completion.
                </div>
              </div>
            </body>
          </html>
        `;
      }
    }

    // 4. Send email via Google Gmail API
    const encodedSubject = `=?utf-8?B?${Buffer.from(emailSubject).toString('base64')}?=`;
    const emailContent = [
      `To: ${partnerEmail}`,
      `Subject: ${encodedSubject}`,
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
