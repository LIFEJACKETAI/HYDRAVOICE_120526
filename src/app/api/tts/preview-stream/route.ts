import { NextRequest, NextResponse } from 'next/server';

// Whitelisted AWS Polly voice names — prevents open proxy abuse
const ALLOWED_VOICES = new Set([
  'Joanna', 'Kendra', 'Ivy', 'Salli', 'Kimberly',
  'Matthew', 'Joey', 'Justin', 'Kevin',
  'Amy', 'Emma', 'Brian',
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const voice = searchParams.get('voice') ?? 'Joanna';
  const text = (searchParams.get('text') ?? '').trim();

  if (!ALLOWED_VOICES.has(voice)) {
    return NextResponse.json({ error: 'Invalid voice' }, { status: 400 });
  }
  if (!text || text.length > 500) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
  }

  const upstream = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(upstream, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Hydravoice/1.0)' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'TTS upstream error' }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
