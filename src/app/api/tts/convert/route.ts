import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';
import { concatenateWavBuffers, pitchShiftWav } from '@/lib/audio-utils';
import { getVoiceById } from '@/lib/voices';

// ─── Plan-based character limits ───────────────────────────────────

const UNAUTHENTICATED_CHAR_LIMIT = 5000;
const AUTHENTICATED_CHAR_LIMIT = 50000;
// Admin users have no limit

// ─── Singleton SDK Instance ────────────────────────────────────────

let _zaiInstance: ZAI | null = null;

async function getSDK(): Promise<ZAI> {
  if (!_zaiInstance) {
    _zaiInstance = await ZAI.create();
  }
  return _zaiInstance;
}

// ─── Text Chunking ─────────────────────────────────────────────────

const MAX_CHUNK_LENGTH = 1000;

function splitTextIntoChunks(text: string, maxLength: number = MAX_CHUNK_LENGTH): string[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitIndex = -1;
    const searchRegion = remaining.substring(0, maxLength);

    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n', '\n\n', '\n'];
    for (const ender of sentenceEnders) {
      const lastIndex = searchRegion.lastIndexOf(ender);
      if (lastIndex > splitIndex) {
        splitIndex = lastIndex + ender.length;
      }
    }

    if (splitIndex <= 0) {
      const lastSpace = searchRegion.lastIndexOf(' ');
      if (lastSpace > 0) {
        splitIndex = lastSpace + 1;
      } else {
        splitIndex = maxLength;
      }
    }

    const chunk = remaining.substring(0, splitIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    remaining = remaining.substring(splitIndex).trim();
  }

  return chunks;
}

// ─── POST Handler ──────────────────────────────────────────────────

/**
 * POST /api/tts/convert
 *
 * Full document conversion: takes text + voice, chunks it, generates
 * audio for each chunk on the server, properly concatenates WAV data,
 * applies pitch shifting via resampling, and returns a single valid WAV file.
 *
 * The pitch shifting now uses proper linear interpolation resampling,
 * so the output is always at 24000 Hz (full quality) instead of the old
 * sample-rate-manipulation method that produced muffled 15000-17000 Hz audio.
 *
 * Request body: { text: string, voiceId: string }
 * Returns: audio/wav binary at 24000 Hz
 */
export async function POST(request: NextRequest) {
  try {
    // ── Optional auth check for plan-based limits ──────────────────
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === 'admin';
    const isAuthenticated = !!session?.user;

    // Determine character limit based on auth status
    let charLimit: number;
    if (isAdmin) {
      charLimit = Infinity; // No limit for admin
    } else if (isAuthenticated) {
      charLimit = AUTHENTICATED_CHAR_LIMIT;
    } else {
      charLimit = UNAUTHENTICATED_CHAR_LIMIT;
    }

    // Support x-user-role header: if the session user is admin, respect the header
    const xUserRole = request.headers.get('x-user-role');
    if (isAdmin && xUserRole) {
      console.log(`[TTS Convert] Admin user requesting with x-user-role: ${xUserRole}`);
    }

    const body = await request.json();
    const { text, voiceId } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Resolve voice profile server-side — client never controls speed or pitch
    if (!voiceId) {
      return NextResponse.json({ error: 'voiceId is required' }, { status: 400 });
    }
    const voiceProfile = getVoiceById(voiceId);
    if (!voiceProfile) {
      return NextResponse.json(
        { error: `Invalid voiceId: ${voiceId}. Please select from available voices.` },
        { status: 400 }
      );
    }

    const voice = voiceProfile.sdkVoice;
    const speed = voiceProfile.ttsSpeed;
    const pitchShift = voiceProfile.pitchShift;

    // Enforce character limit
    if (text.trim().length > charLimit) {
      const limitLabel = isAdmin
        ? 'unlimited'
        : isAuthenticated
          ? `${AUTHENTICATED_CHAR_LIMIT.toLocaleString()}`
          : `${UNAUTHENTICATED_CHAR_LIMIT.toLocaleString()}`;
      const suggestion = !isAuthenticated
        ? ' Sign in for longer conversions (up to 50,000 characters).'
        : !isAdmin
          ? ' Upgrade your plan for longer conversions.'
          : '';
      return NextResponse.json(
        {
          error: `Text exceeds the ${limitLabel} character limit (${text.trim().length.toLocaleString()} characters).${suggestion}`,
        },
        { status: 400 }
      );
    }

    // Calculate effective speed: generate at (speed * pitchShift) so that after
    // resampling (stretching by pitchShift), final playback speed is just `speed`
    const effectiveSpeed = speed * pitchShift;

    // All curated voice profiles are designed to stay within this range,
    // but guard against future profile mistakes
    if (effectiveSpeed < 0.5 || effectiveSpeed > 1.5) {
      return NextResponse.json(
        { error: `Voice profile "${voiceProfile.name}" has an invalid effective speed (${effectiveSpeed.toFixed(2)}). Must be 0.5–1.5.` },
        { status: 500 }
      );
    }

    const chunks = splitTextIntoChunks(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No text content to convert' }, { status: 400 });
    }

    const zai = await getSDK();
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[TTS Convert] Chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

      let audioBuffer: Buffer | null = null;
      let retries = 0;
      const maxRetries = 2;

      while (!audioBuffer && retries < maxRetries) {
        try {
          const response = await zai.audio.tts.create({
            model: 'glm-tts',
            input: chunk,
            voice: voice,
            speed: effectiveSpeed,
            response_format: 'wav',
            stream: false,
          });

          const arrayBuffer = await response.arrayBuffer();
          audioBuffer = Buffer.from(new Uint8Array(arrayBuffer));
        } catch (error) {
          retries++;
          console.warn(`[TTS Convert] Chunk ${i + 1} attempt ${retries} failed:`, error);
          if (retries < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * retries));
          } else {
            console.error(`[TTS Convert] Chunk ${i + 1} failed after ${maxRetries} attempts`);
            return NextResponse.json(
              { error: `Failed to convert chunk ${i + 1} of ${chunks.length}. The TTS service may be temporarily unavailable.` },
              { status: 500 }
            );
          }
        }
      }

      if (audioBuffer) {
        audioBuffers.push(audioBuffer);
      }
    }

    // Concatenate WAV chunks into one clean WAV
    let combinedBuffer = concatenateWavBuffers(audioBuffers);

    // Apply pitch shifting via proper resampling (always outputs 24000 Hz)
    if (pitchShift > 1.01) {
      combinedBuffer = pitchShiftWav(combinedBuffer, pitchShift);
    }

    console.log(`[TTS Convert] Complete: ${combinedBuffer.length} bytes, ${chunks.length} chunks, voice=${voiceProfile.name} (${voice}), speed=${speed}, pitchShift=${pitchShift}, output=24000Hz`);

    return new NextResponse(combinedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': combinedBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[TTS Convert] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS conversion failed' },
      { status: 500 }
    );
  }
}
