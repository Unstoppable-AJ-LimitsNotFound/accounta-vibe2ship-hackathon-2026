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
      prompt = `You are Accounta, an AI-powered habit accountability coach. The user ${userName || 'User'} failed to complete these daily habits:
${missedHabits && missedHabits.length > 0 ? missedHabits.map((h: string) => `- ${h}`).join('\n') : '(None)'}

Write a short, highly self-deprecating, funny, and slightly embarrassing "shame post" in the first person ("I failed...", "I was too lazy...") for Twitter/X and LinkedIn. The tone should be punchy, sarcastic, and self-revelatory about their lack of discipline. Keep it under 240 characters total so it fits on Twitter/X easily. Use hashtags like #Accounta #DisciplineIsHard #NoExcuses. Do not use quotes or introductory text around the post.`;
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
