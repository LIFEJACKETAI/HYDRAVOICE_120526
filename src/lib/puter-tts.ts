'use client';

/**
<<<<<<< HEAD
 * Client-side TTS engine powered by Puter.js (puter.ai.txt2speech).
 *
 * Puter.js routes to OpenAI TTS — free, no API key required, runs in the browser.
 * Voices: alloy | echo | fable | onyx | nova | shimmer
 */

import { getVoiceById, splitTextIntoChunks } from './voices';

// ═══════════════════════════════════════════════════════════════════
// PART 1: Voice Previews (Puter.js client-side)
=======
 * Client-side TTS using Puter.js (puter.ai.txt2speech).
 *
 * No API key required — Puter handles auth via its CDN script.
 * All TTS happens in the browser; no backend TTS routes needed.
 *
 * Voice previews: instant, single puter.ai.txt2speech() call.
 * Document conversion: text is chunked client-side, each chunk is
 * synthesised via Puter with an 800ms inter-chunk delay (rate-limit
 * protection), the resulting AudioBuffers are decoded and concatenated
 * via the Web Audio API, and the merged WAV blob is offered as a download.
 *
 * Engine gating by plan:
 *   free/echo    → { engine: 'standard' }
 *   starter/spark → { engine: 'neural' }
 *   pro/roar     → { provider: 'gemini', model: 'gemini-2.5-flash-preview-tts' }
 *   business/chorus / enterprise/hydra → { provider: 'xai' }
 */

import { getVoiceById } from './voices';
import { useAppStore } from './store';
import type { PuterTTSOptions } from '../types/puter';

// ═══════════════════════════════════════════════════════════════════
// PART 1: Voice Previews
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
// ═══════════════════════════════════════════════════════════════════

let currentPreviewAudio: HTMLAudioElement | null = null;
let currentPreviewVoiceId: string | null = null;

<<<<<<< HEAD
/**
 * Play a voice preview using Puter.js TTS.
 * Calls puter.ai.txt2speech() directly in the browser — no server needed.
 */
=======
function getPuter(): Puter {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter.js is not loaded yet. Please try again in a moment.');
  }
  return window.puter;
}

function getPuterOptions(plan: string): PuterTTSOptions {
  switch (plan) {
    case 'starter':
    case 'spark':
      return { engine: 'neural' };
    case 'pro':
    case 'roar':
      return { provider: 'gemini', model: 'gemini-2.5-flash-preview-tts' };
    case 'business':
    case 'chorus':
    case 'enterprise':
    case 'hydra':
      return { provider: 'xai' };
    default:
      return { engine: 'standard' };
  }
}

>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
export async function playVoicePreview(voiceId: string): Promise<void> {
  stopVoicePreview();

  const voiceProfile = getVoiceById(voiceId);
  if (!voiceProfile) throw new Error(`Voice profile not found: ${voiceId}`);

  if (typeof puter === 'undefined') {
    throw new Error('Puter.js is not loaded. Please refresh the page and try again.');
  }

<<<<<<< HEAD
  console.log(`[Puter TTS Preview] voiceId=${voiceId}, puterVoice=${voiceProfile.puterVoice}`);

  const audio = await puter.ai.txt2speech(voiceProfile.previewText, {
    voice: voiceProfile.puterVoice,
  });

  currentPreviewAudio = audio;
  currentPreviewVoiceId = voiceId;

  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      currentPreviewVoiceId = null;
      resolve();
    };

    audio.onerror = () => {
      currentPreviewVoiceId = null;
      currentPreviewAudio = null;
      reject(new Error('Voice preview failed: audio playback error'));
    };

    audio.play().catch((err) => {
      console.warn('[Puter TTS Preview] Autoplay blocked:', err);
      resolve();
    });
  });
=======
  try {
    const puter = getPuter();
    const { user } = useAppStore.getState();
    const options = getPuterOptions(user?.plan ?? 'free');

    console.log(`[TTS Preview] Requesting Puter preview for: ${voiceId}`, options);
    const audio = await puter.ai.txt2speech(voiceProfile.previewText, options);

    audio.playbackRate = voiceProfile.ttsSpeed;
    currentPreviewAudio = audio;
    currentPreviewVoiceId = voiceId;

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        currentPreviewVoiceId = null;
        resolve();
      };

      audio.onerror = () => {
        currentPreviewVoiceId = null;
        currentPreviewAudio = null;
        reject(new Error('Voice preview playback error'));
      };

      audio.play().catch((err) => {
        console.warn('[TTS Preview] Autoplay blocked:', err);
        resolve();
      });
    });
  } catch (error) {
    currentPreviewVoiceId = null;
    currentPreviewAudio = null;
    console.error('[TTS Preview] Error:', error);
    throw error;
  }
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
}

export function stopVoicePreview(): void {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
  }
  currentPreviewVoiceId = null;
}

export function isVoicePreviewPlaying(voiceId: string): boolean {
  return (
    currentPreviewVoiceId === voiceId &&
    currentPreviewAudio !== null &&
    !currentPreviewAudio.paused
  );
}

<<<<<<< HEAD
/**
 * Check if Puter.js TTS is available.
 */
export function isBrowserTTSAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).puter !== 'undefined';
}

// ═══════════════════════════════════════════════════════════════════
// PART 2: Document Conversion (Puter.js client-side)
=======
export function isBrowserTTSAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.puter;
}

// ═══════════════════════════════════════════════════════════════════
// PART 2: Document Conversion
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
// ═══════════════════════════════════════════════════════════════════

export interface ConversionProgress {
  currentChunk: number;
  totalChunks: number;
  percent: number;
  status: 'preparing' | 'converting' | 'complete' | 'error';
  message: string;
  engine: 'puter';
}

export interface ConversionResult {
  audioBlob: Blob;
  audioUrl: string;
  totalDuration: number;
  totalSize: number;
  engine: 'puter';
<<<<<<< HEAD
}

// ── WAV encoder ───────────────────────────────────────────────────

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

// ── Main conversion ───────────────────────────────────────────────

/**
 * Convert text to audio using Puter.js TTS (OpenAI TTS via Puter cloud).
 *
 * Chunks the text, calls puter.ai.txt2speech() for each chunk,
 * stitches the decoded audio buffers together, and encodes as WAV.
 * Runs 100% client-side — no server involved.
 */
=======
}

const MAX_CHUNK_LENGTH = 1000;
const CHUNK_DELAY_MS = 800;

function splitTextIntoChunks(text: string, maxLength = MAX_CHUNK_LENGTH): string[] {
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
      splitIndex = lastSpace > 0 ? lastSpace + 1 : maxLength;
    }

    const chunk = remaining.substring(0, splitIndex).trim();
    if (chunk.length > 0) chunks.push(chunk);
    remaining = remaining.substring(splitIndex).trim();
  }

  return chunks;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function audioElementToArrayBuffer(audio: HTMLAudioElement): Promise<ArrayBuffer> {
  const response = await fetch(audio.src);
  return response.arrayBuffer();
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wavBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return wavBuffer;
}

function concatenateAudioBuffers(ctx: AudioContext, buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) throw new Error('No audio buffers to concatenate');
  if (buffers.length === 1) return buffers[0];

  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const numChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
  const sampleRate = buffers[0].sampleRate;

  const merged = ctx.createBuffer(numChannels, totalLength, sampleRate);
  let offset = 0;

  for (const buf of buffers) {
    for (let ch = 0; ch < numChannels; ch++) {
      const srcData = ch < buf.numberOfChannels
        ? buf.getChannelData(ch)
        : new Float32Array(buf.length);
      merged.getChannelData(ch).set(srcData, offset);
    }
    offset += buf.length;
  }

  return merged;
}

>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
export async function convertTextToAudio(
  text: string,
  voiceId: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  const voiceProfile = getVoiceById(voiceId);
  if (!voiceProfile) throw new Error(`Voice profile not found: ${voiceId}`);
  if (!text?.trim()) throw new Error('No text content to convert to audio');
  if (typeof puter === 'undefined') {
    throw new Error('Puter.js is not loaded. Please refresh the page and try again.');
  }

  const chunks = splitTextIntoChunks(text.trim());
  const totalChunks = chunks.length;

  const { user } = useAppStore.getState();
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  const planLimits: Record<string, number> = {
    free: 10000,
    echo: 10000,
    starter: 500000,
    spark: 500000,
    pro: 2000000,
    roar: 2000000,
    business: 6000000,
    chorus: 6000000,
    enterprise: Infinity,
    hydra: Infinity,
  };

  const plan = user?.plan ?? 'free';
  const charLimit = isAdmin ? Infinity : (planLimits[plan] ?? (isAuthenticated ? 10000 : 5000));

  if (text.trim().length > charLimit) {
    const limitLabel = charLimit === Infinity ? 'unlimited' : charLimit.toLocaleString();
    throw new Error(
      `Text exceeds your ${plan} plan limit of ${limitLabel} characters (${text.trim().length.toLocaleString()} characters).`
    );
  }

  const puter = getPuter();
  const ttsOptions = getPuterOptions(plan);
  const chunks = splitTextIntoChunks(text);

  if (chunks.length === 0) {
    throw new Error('No text content to convert to audio');
  }

  onProgress?.({
    currentChunk: 0,
<<<<<<< HEAD
    totalChunks,
    percent: 5,
    status: 'preparing',
    message: `Preparing ${totalChunks} chunk${totalChunks !== 1 ? 's' : ''} for conversion...`,
    engine: 'puter',
  });

  const audioContext = new AudioContext();
  const decodedBuffers: AudioBuffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const percent = 5 + Math.round(((i + 0.5) / totalChunks) * 80);

    onProgress?.({
      currentChunk: i + 1,
      totalChunks,
      percent,
      status: 'converting',
      message: `Converting chunk ${i + 1} of ${totalChunks}...`,
      engine: 'puter',
    });

    let audioBuffer: AudioBuffer | null = null;
    let attempt = 0;

    while (!audioBuffer && attempt < 3) {
      try {
        attempt++;
        const audio = await puter.ai.txt2speech(chunk, { voice: voiceProfile.puterVoice });
        const response = await fetch(audio.src);
        if (!response.ok) throw new Error(`Failed to fetch audio blob: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } catch (err) {
        if (attempt >= 3) {
          throw new Error(
            `Failed to convert chunk ${i + 1} after 3 attempts. Please try again. (${err})`
          );
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    if (audioBuffer) decodedBuffers.push(audioBuffer);
=======
    totalChunks: chunks.length,
    percent: 5,
    status: 'preparing',
    message: `Preparing ${chunks.length} chunk${chunks.length > 1 ? 's' : ''}…`,
    engine: 'puter',
  });

  const audioCtx = new AudioContext();
  const audioBuffers: AudioBuffer[] = [];

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[TTS Convert] Chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`, ttsOptions);

      onProgress?.({
        currentChunk: i + 1,
        totalChunks: chunks.length,
        percent: Math.round(5 + ((i + 1) / chunks.length) * 85),
        status: 'converting',
        message: `Converting chunk ${i + 1} of ${chunks.length}…`,
        engine: 'puter',
      });

      const audio = await puter.ai.txt2speech(chunk, ttsOptions);
      const arrayBuffer = await audioElementToArrayBuffer(audio);
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      audioBuffers.push(decoded);

      // 800ms rate-limit delay between chunks
      if (i < chunks.length - 1) {
        await delay(CHUNK_DELAY_MS);
      }
    }

    const merged = concatenateAudioBuffers(audioCtx, audioBuffers);
    const wavArrayBuffer = audioBufferToWav(merged);
    const audioBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    console.log(`[TTS Convert] Complete: ${audioBlob.size} bytes, ${chunks.length} chunks`);

    onProgress?.({
      currentChunk: chunks.length,
      totalChunks: chunks.length,
      percent: 100,
      status: 'complete',
      message: 'Conversion complete!',
      engine: 'puter',
    });

    await audioCtx.close();

    return {
      audioBlob,
      audioUrl,
      totalDuration: merged.duration,
      totalSize: audioBlob.size,
      engine: 'puter',
    };
  } catch (error) {
    onProgress?.({
      currentChunk: 0,
      totalChunks: chunks.length,
      percent: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Conversion failed',
      engine: 'puter',
    });
    await audioCtx.close().catch(() => {});
    throw error;
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
  }

  onProgress?.({
    currentChunk: totalChunks,
    totalChunks,
    percent: 90,
    status: 'converting',
    message: 'Stitching audio together...',
    engine: 'puter',
  });

  // Concatenate all decoded buffers into a single mono WAV
  const sampleRate = decodedBuffers[0].sampleRate;
  const totalLength = decodedBuffers.reduce((sum, b) => sum + b.length, 0);
  const combined = new Float32Array(totalLength);
  let writeOffset = 0;

  for (const buf of decodedBuffers) {
    const ch0 = buf.getChannelData(0);
    if (buf.numberOfChannels > 1) {
      const ch1 = buf.getChannelData(1);
      for (let i = 0; i < buf.length; i++) {
        combined[writeOffset + i] = (ch0[i] + ch1[i]) / 2;
      }
    } else {
      combined.set(ch0, writeOffset);
    }
    writeOffset += buf.length;
  }

  const wavBuffer = encodeWAV(combined, sampleRate);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);
  const durationSeconds = totalLength / sampleRate;

  console.log(
    `[Puter TTS] Complete: ${blob.size} bytes, ${totalChunks} chunks, voice=${voiceProfile.name} (${voiceProfile.puterVoice}), ${durationSeconds.toFixed(1)}s`
  );

  onProgress?.({
    currentChunk: totalChunks,
    totalChunks,
    percent: 100,
    status: 'complete',
    message: 'Conversion complete!',
    engine: 'puter',
  });

  return {
    audioBlob: blob,
    audioUrl,
    totalDuration: Math.round(durationSeconds * 100) / 100,
    totalSize: blob.size,
    engine: 'puter',
  };
}

// ═══════════════════════════════════════════════════════════════════
// PART 3: Utilities
// ═══════════════════════════════════════════════════════════════════

export function downloadAudioBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = blob.type.includes('wav')
    ? '.wav'
    : blob.type.includes('mp3') || blob.type.includes('mpeg')
      ? '.mp3'
      : blob.type.includes('ogg')
        ? '.ogg'
        : '.audio';
  a.download = filename.endsWith(ext) ? filename : `${filename}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function revokeAudioUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}
