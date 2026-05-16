import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { cleanWavFile, pitchShiftWav } from '@/lib/audio-utils';
import { getVoiceById } from '@/lib/voices';

// ─── Singleton SDK Instance ────────────────────────────────────────

let _zaiInstance: ZAI | null = null;

async function getSDK(): Promise<ZAI> {
  if (!_zaiInstance) {
    _zaiInstance = await ZAI.create();
  }
  return _zaiInstance;
}

/**
 * POST /api/tts/preview
 *
 * Generate a short voice preview clip using the backend TTS SDK.
 * Uses proper resampling-based pitch shifting (always outputs 24000 Hz).
 *
 * Request body: { voiceId: string }
 *   voiceId — one of the 20 voice profile IDs (e.g., 'ma-william', 'fb-charlotte')
 * Returns: audio/wav binary at 24000 Hz
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId } = body;

    // Look up the voice profile by ID
    const voiceProfile = voiceId ? getVoiceById(voiceId) : null;

    // Determine SDK voice, speed, pitch shift, and preview text
    const sdkVoice = voiceProfile?.sdkVoice || 'kazi';
    const speed = voiceProfile?.ttsSpeed || 1.0;
    const pitchShift = voiceProfile?.pitchShift || 1.0;
    const previewText = voiceProfile?.previewText || 'Hello, this is a preview of the voice. How does it sound?';

    // Validate voice — only English-capable SDK voices
    const validVoices = ['jam', 'kazi'];
    if (!validVoices.includes(sdkVoice)) {
      return NextResponse.json(
        { error: `Invalid voice: ${sdkVoice}. Available English voices: ${validVoices.join(', ')}` },
        { status: 400 }
      );
    }

    const zai = await getSDK();

    // Generate at faster speed to compensate for pitch shift resampling
    const effectiveSpeed = speed * pitchShift;
    console.log(`[TTS Preview] Generating: voiceId=${voiceId}, sdkVoice=${sdkVoice}, speed=${speed}, pitchShift=${pitchShift}, effectiveSpeed=${effectiveSpeed.toFixed(2)}`);

    const response = await zai.audio.tts.create({
      model: 'cogtts',
      input: previewText,
      voice: sdkVoice,
      speed: effectiveSpeed,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const rawBuffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Apply pitch shifting via proper resampling (always outputs 24000 Hz)
    let buffer: Buffer;
    if (pitchShift > 1.01) {
      buffer = pitchShiftWav(rawBuffer, pitchShift);
    } else {
      buffer = cleanWavFile(rawBuffer);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[TTS Preview] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview generation failed' },
      { status: 500 }
    );
  }
}
