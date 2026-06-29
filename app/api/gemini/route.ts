import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, completedHabits, missedHabits, userName } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing generation type' }, { status: 400 });
    }

    let prompt = '';

    if (type === 'email') {
      prompt = `You are Accounta, an AI-powered habit accountability coach. The user ${userName || 'User'} completed the following habits today:
${completedHabits && completedHabits.length > 0 ? completedHabits.map((h: string) => `- ${h}`).join('\n') : '(None)'}

But they MISSED completing these habits:
${missedHabits && missedHabits.length > 0 ? missedHabits.map((h: string) => `- ${h}`).join('\n') : '(None)'}

Generate a concise, professional, yet sharp and direct accountability analysis message to be included in an email to their accountability partner. Be honest, motivational, but firm (or shaming if they missed everything). Keep it under 150 words and do not use any markdown formatting or placeholders like [Partner Name].`;
    } else if (type === 'shame') {
      prompt = `You are Accounta, a brutal, sarcastic, and ego-bruising habit accountability coach. The user ${userName || 'User'} failed to complete these specific daily habits:
${missedHabits && missedHabits.length > 0 ? missedHabits.map((h: string) => `- ${h}`).join('\n') : '(None)'}

Write a short, highly embarrassing, sarcastic, and hard-hitting "shame post" in the first person ("I failed...", "My lack of discipline...") for Twitter/X and LinkedIn.
Requirements:
1. You MUST name the exact missed habits by name: ${missedHabits && missedHabits.length > 0 ? missedHabits.join(', ') : 'my habits'}.
2. It must be brutally honest, making the user feel the heavy weight of their pathetic failure and lack of willpower.
3. Keep the tone sharp, biting, and sarcastic.
4. The entire post must end exactly with the hashtags "#AccountaShame #NoExcuses".
5. The final output must be under 280 characters total so it fits on Twitter/X easily.
6. Do NOT use quotes, introductory text, or markdown code blocks around the post. Output ONLY the raw post content.`;
    } else {
      return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
