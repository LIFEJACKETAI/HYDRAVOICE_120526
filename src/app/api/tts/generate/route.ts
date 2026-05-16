import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ─── Singleton SDK Instance ────────────────────────────────────────

let _zaiInstance: ZAI | null = null;

async function getSDK(): Promise<ZAI> {
  if (!_zaiInstance) {
    _zaiInstance = await ZAI.create();
  }
  return _zaiInstance;
}

/**
 * POST /api/tts/generate
 *
 * Generates TTS audio for a single text chunk.
 * Request body: { text: string, voice: string, speed?: number }
 * Returns: audio/wav binary data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'kazi', speed = 1.0 } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Enforce 1024 character limit (SDK constraint)
    if (text.length > 1024) {
      return NextResponse.json(
        { error: `Text too long (${text.length} chars). Maximum is 1024 characters per request.` },
        { status: 400 }
      );
    }

    // Validate voice — only English-capable SDK voices
    const validVoices = ['jam', 'kazi'];
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice: ${voice}. Available: ${validVoices.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate speed
    if (speed < 0.5 || speed > 2.0) {
      return NextResponse.json(
        { error: 'Speed must be between 0.5 and 2.0' },
        { status: 400 }
      );
    }

    const zai = await getSDK();

    const response = await zai.audio.tts.create({
      model: 'glm-tts',
      input: text.trim(),
      voice: voice,
      speed: speed,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS generation failed' },
      { status: 500 }
    );
  }
}
