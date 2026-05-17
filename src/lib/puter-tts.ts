/**
 * Client-side TTS using Puter.js (puter.ai.txt2speech).
 *
 * No API key required — Puter handles auth via its CDN script.
 * All TTS happens in the browser; no backend TTS routes needed.
 *
 * Voice previews: instant, single puter.ai.txt2speech() call.
 * Document conversion: text is chunked client-side, each chunk is
 * synthesised via Puter, the resulting audio blobs are concatenated,
 * and the merged blob is offered as a download.
 */

import { getVoiceById } from './voices';
import { useAppStore } from './store';

// ═══════════════════════════════════════════════════════════════════
// PART 1: Voice Previews
// ═══════════════════════════════════════════════════════════════════

let currentPreviewAudio: HTMLAudioElement | null = null;
let currentPreviewVoiceId: string | null = null;

function getPuter(): Puter {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter.js is not loaded yet. Please try again in a moment.');
  }
  return window.puter;
}

export async function playVoicePreview(voiceId: string): Promise<void> {
  stopVoicePreview();

  const voiceProfile = getVoiceById(voiceId);
  if (!voiceProfile) {
    console.warn(`Voice profile not found: ${voiceId}`);
    return;
  }

  try {
    console.log(`[TTS Preview] Requesting Puter preview for: ${voiceId}`);
    const puter = getPuter();
    const audio = await puter.ai.txt2speech(voiceProfile.previewText);

    // Apply speed variation for voice differentiation
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

export function isBrowserTTSAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.puter;
}

// ═══════════════════════════════════════════════════════════════════
// PART 2: Document Conversion
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

const MAX_CHUNK_LENGTH = 1000;

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

async function audioElementToBlob(audio: HTMLAudioElement): Promise<Blob> {
  const response = await fetch(audio.src);
  return response.blob();
}

export async function convertTextToAudio(
  text: string,
  voiceId: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  const voiceProfile = getVoiceById(voiceId);
  if (!voiceProfile) {
    throw new Error(`Voice profile not found: ${voiceId}`);
  }

  if (!text || text.trim().length === 0) {
    throw new Error('No text content to convert to audio');
  }

  // Check plan limits via the backend (auth + character limits still apply)
  const { user } = useAppStore.getState();
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;
  const charLimit = isAdmin ? Infinity : isAuthenticated ? 50000 : 5000;

  if (text.trim().length > charLimit) {
    const limitLabel = isAuthenticated ? '50,000' : '5,000';
    const suggestion = !isAuthenticated
      ? ' Sign in for longer conversions (up to 50,000 characters).'
      : ' Upgrade your plan for longer conversions.';
    throw new Error(
      `Text exceeds the ${limitLabel} character limit (${text.trim().length.toLocaleString()} characters).${suggestion}`
    );
  }

  const puter = getPuter();
  const chunks = splitTextIntoChunks(text);

  if (chunks.length === 0) {
    throw new Error('No text content to convert to audio');
  }

  onProgress?.({
    currentChunk: 0,
    totalChunks: chunks.length,
    percent: 5,
    status: 'preparing',
    message: `Preparing ${chunks.length} chunk${chunks.length > 1 ? 's' : ''}…`,
    engine: 'puter',
  });

  const blobs: Blob[] = [];
  let audioMimeType = 'audio/wav';

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[TTS Convert] Chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

      onProgress?.({
        currentChunk: i + 1,
        totalChunks: chunks.length,
        percent: Math.round(5 + ((i + 1) / chunks.length) * 85),
        status: 'converting',
        message: `Converting chunk ${i + 1} of ${chunks.length}…`,
        engine: 'puter',
      });

      const audio = await puter.ai.txt2speech(chunk);
      audio.playbackRate = voiceProfile.ttsSpeed;

      const blob = await audioElementToBlob(audio);
      if (blob.type) audioMimeType = blob.type;
      blobs.push(blob);
    }

    const audioBlob = new Blob(blobs, { type: audioMimeType });
    const audioUrl = URL.createObjectURL(audioBlob);

    console.log(`[TTS Convert] Complete: ${audioBlob.size} bytes, ${chunks.length} chunks`);

    // Rough duration estimate: assume ~150 words/minute average TTS speed
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    onProgress?.({
      currentChunk: chunks.length,
      totalChunks: chunks.length,
      percent: 100,
      status: 'complete',
      message: 'Conversion complete!',
      engine: 'puter',
    });

    return {
      audioBlob,
      audioUrl,
      totalDuration: Math.round(estimatedDuration * 100) / 100,
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
    throw error;
  }
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
