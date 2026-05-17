'use client';

/**
 * Client-side TTS engine powered by Puter.js (puter.ai.txt2speech).
 *
 * Puter.js routes to OpenAI TTS — free, no API key required, runs in the browser.
 * Voices: alloy | echo | fable | onyx | nova | shimmer
 */

import { getVoiceById, splitTextIntoChunks } from './voices';

// ═══════════════════════════════════════════════════════════════════
// PART 1: Voice Previews (Puter.js client-side)
// ═══════════════════════════════════════════════════════════════════

let currentPreviewAudio: HTMLAudioElement | null = null;
let currentPreviewVoiceId: string | null = null;

/**
 * Play a voice preview using Puter.js TTS.
 * Calls puter.ai.txt2speech() directly in the browser — no server needed.
 */
export async function playVoicePreview(voiceId: string): Promise<void> {
  stopVoicePreview();

  const voiceProfile = getVoiceById(voiceId);
  if (!voiceProfile) throw new Error(`Voice profile not found: ${voiceId}`);

  if (typeof puter === 'undefined') {
    throw new Error('Puter.js is not loaded. Please refresh the page and try again.');
  }

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
}

/**
 * Stop the currently playing voice preview.
 */
export function stopVoicePreview(): void {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
  }
  currentPreviewVoiceId = null;
}

/**
 * Check if a specific voice is currently playing its preview.
 */
export function isVoicePreviewPlaying(voiceId: string): boolean {
  return (
    currentPreviewVoiceId === voiceId &&
    currentPreviewAudio !== null &&
    !currentPreviewAudio.paused
  );
}

/**
 * Check if Puter.js TTS is available.
 */
export function isBrowserTTSAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).puter !== 'undefined';
}

// ═══════════════════════════════════════════════════════════════════
// PART 2: Document Conversion (Puter.js client-side)
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

  onProgress?.({
    currentChunk: 0,
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

/**
 * Download an audio blob as a file.
 */
export function downloadAudioBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = blob.type.includes('wav') ? '.wav' : blob.type.includes('webm') ? '.webm' : '.mp3';
  a.download = filename.endsWith(ext) ? filename : `${filename}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Clean up an object URL created for audio playback.
 */
export function revokeAudioUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Ignore
  }
}
