import ZAI from 'z-ai-web-dev-sdk';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { concatenateWavBuffers, pitchShiftWav } from './audio-utils';

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

/**
 * Split text into chunks at sentence boundaries, respecting max length.
 * Tries to break on period, question mark, exclamation, or newline.
 */
export function splitTextIntoChunks(text: string, maxLength: number = MAX_CHUNK_LENGTH): string[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find the last sentence boundary within maxLength
    let splitIndex = -1;
    const searchRegion = remaining.substring(0, maxLength);

    // Look for sentence-ending punctuation or newline
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n', '\n\n', '\n'];
    for (const ender of sentenceEnders) {
      const lastIndex = searchRegion.lastIndexOf(ender);
      if (lastIndex > splitIndex) {
        splitIndex = lastIndex + ender.length;
      }
    }

    // Fallback: break on any space
    if (splitIndex <= 0) {
      const lastSpace = searchRegion.lastIndexOf(' ');
      if (lastSpace > 0) {
        splitIndex = lastSpace + 1;
      } else {
        // Last resort: hard cut
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

// ─── Single Chunk TTS ──────────────────────────────────────────────

/**
 * Convert a single text chunk to audio using the TTS SDK.
 * Returns the audio buffer.
 */
export async function textToAudio(
  text: string,
  voice: string = 'kazi',
  speed: number = 1.0
): Promise<Buffer> {
  const zai = await getSDK();

  const response = await zai.audio.tts.create({
    input: text,
    voice: voice,
    speed: speed,
    response_format: 'wav',
    stream: false,
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(new Uint8Array(arrayBuffer));
}

// ─── Long Document Processing ──────────────────────────────────────

/**
 * Process a long document by chunking text, generating audio for each chunk,
 * properly concatenating WAV data, applying pitch shift, and saving to disk.
 *
 * Returns the file path of the generated audio file.
 */
export async function processDocumentToAudio(
  text: string,
  voice: string = 'kazi',
  speed: number = 1.0,
  outputFileName: string,
  pitchShift: number = 1.0
): Promise<{ filePath: string; fileSize: number; duration: number }> {
  const outputDir = path.join(process.cwd(), 'audio-output');
  await mkdir(outputDir, { recursive: true });

  const chunks = splitTextIntoChunks(text);
  if (chunks.length === 0) {
    throw new Error('No text content to convert to audio');
  }

  const audioBuffers: Buffer[] = [];

  // Generate TTS at effectiveSpeed = speed * pitchShift so that after
  // resampling (stretching by pitchShift), final playback speed is just `speed`
  const effectiveSpeed = speed * pitchShift;
  console.log(`[TTS] Processing ${chunks.length} chunks, voice=${voice}, speed=${speed}, pitchShift=${pitchShift}, effectiveSpeed=${effectiveSpeed.toFixed(3)}`);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`[TTS] Chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
    const audioBuffer = await textToAudio(chunks[i], voice, effectiveSpeed);
    audioBuffers.push(audioBuffer);
  }

  // Properly concatenate WAV chunks (strips per-chunk headers, writes one clean header)
  let combinedBuffer = concatenateWavBuffers(audioBuffers);

  // Apply pitch shifting via linear interpolation resampling (always outputs 24000 Hz)
  if (pitchShift > 1.01) {
    combinedBuffer = pitchShiftWav(combinedBuffer, pitchShift);
  }

  const filePath = path.join(outputDir, outputFileName);
  await writeFile(filePath, combinedBuffer);

  // Duration: 24000 Hz, 16-bit mono = 48000 bytes/sec; subtract 44-byte WAV header
  const estimatedDurationSeconds = (combinedBuffer.length - 44) / 48000;

  return {
    filePath,
    fileSize: combinedBuffer.length,
    duration: Math.round(estimatedDurationSeconds * 100) / 100,
  };
}
