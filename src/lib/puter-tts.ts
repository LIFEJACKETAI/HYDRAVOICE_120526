'use client';

/**
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
 *   free/echo     → { engine: 'standard' }
 *   starter/spark → { engine: 'neural' }
 *   pro/roar      → { provider: 'gemini', model: 'gemini-2.5-flash-preview-tts' }
 *   business/chorus / enterprise/hydra → { provider: 'xai' }
 */

import { getVoiceById, type VoiceProfile } from './voices';
import { useAppStore } from './store';
import type { PuterTTSOptions } from '../types/puter';

// ═══════════════════════════════════════════════════════════════════
// PART 1: Voice Previews
// ═══════════════════════════════════════════════════════════════════

let currentPreviewAudio: HTMLAudioElement | null = null;
let currentPreviewVoiceId: string | null = null;
let currentSpeechUtterance: SpeechSynthesisUtterance | null = null;

// Load browser speech synthesis voices — they're delivered async on first call.
function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) return Promise.resolve(voices);
  return new Promise((resolve) => {
    const onChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChanged);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 2500);
  });
}

// Filter to voices that actually sound good.
// eSpeak (Linux fallback) and Orca screen-reader voices are excluded.
function qualitySpeechVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return all.filter((v) => {
    const name = v.name.toLowerCase();
    const uri  = v.voiceURI.toLowerCase();
    const isRobotic =
      name.includes('espeak') || uri.includes('espeak') ||
      name.includes('orca')   || uri.includes('orca')   ||
      uri.startsWith('urn:moz-tts:sapi:') ||   // Firefox eSpeak wrapper
      (name.startsWith('en ') && !name.includes('google') && !name.includes('microsoft') && !name.includes('apple'));
    const isEnglish = v.lang.startsWith('en');
    return !isRobotic && isEnglish;
  });
}

// Pick the best available voice for a given profile.
function selectSpeechVoice(
  voices: SpeechSynthesisVoice[],
  voiceProfile: VoiceProfile,
): SpeechSynthesisVoice | undefined {
  const { accent, browserVoice } = voiceProfile;
  const targetLangs = accent === 'British' ? ['en-GB', 'en_GB'] : ['en-US', 'en_US'];
  const matchesLang = (v: SpeechSynthesisVoice) => targetLangs.some((l) => v.lang.startsWith(l));

  // Try each hint in priority order
  for (const hint of browserVoice.voiceHints) {
    const match = voices.find(
      (v) => v.name.toLowerCase().includes(hint.toLowerCase()) && matchesLang(v),
    );
    if (match) return match;
  }
  // Fallback: any voice with the right accent
  const accentMatch = voices.find(matchesLang);
  if (accentMatch) return accentMatch;
  // Last resort: any quality English voice
  return voices[0];
}

// Browser TTS preview using the Web Speech API.
// Chrome/Safari/Edge provide Google, Apple, and Microsoft neural voices which
// sound excellent. eSpeak (Linux/Firefox) is intentionally filtered out.
async function playBrowserTTSPreview(voiceProfile: VoiceProfile): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Speech synthesis is not supported in this browser.');
  }

  const allVoices = await loadSpeechVoices();
  const quality   = qualitySpeechVoices(allVoices);

  if (quality.length === 0) {
    throw new Error(
      'No high-quality voices found. For voice previews, please use Chrome or Safari.',
    );
  }

  const voice = selectSpeechVoice(quality, voiceProfile);
  if (!voice) throw new Error('No suitable voice found for preview.');

  return new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(voiceProfile.previewText);
    utterance.voice  = voice;
    utterance.lang   = voice.lang;
    utterance.rate   = voiceProfile.browserVoice.rate;
    utterance.pitch  = voiceProfile.browserVoice.pitch;
    utterance.volume = 1;

    utterance.onend   = () => { currentSpeechUtterance = null; currentPreviewVoiceId = null; resolve(); };
    utterance.onerror = (e) => {
      currentSpeechUtterance = null;
      currentPreviewVoiceId  = null;
      reject(new Error(`Speech synthesis error: ${e.error}`));
    };

    currentSpeechUtterance = utterance;
    currentPreviewVoiceId  = voiceProfile.id;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

function getPuter(): Puter {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter.js is not loaded yet. Please try again in a moment.');
  }
  return window.puter;
}

async function ensurePuterAuth(): Promise<void> {
  const puter = getPuter();
  if (!puter.auth.isSignedIn()) {
    await puter.auth.signIn();
  }
}

function getPuterOptions(plan: string, voiceProfile: VoiceProfile): PuterTTSOptions {
  switch (plan) {
    case 'starter':
    case 'spark':
      return { voice: voiceProfile.puterVoice, engine: 'neural' };
    case 'pro':
    case 'roar': {
      // Map to Gemini voices by gender+accent
      const geminiVoices: Record<string, string[]> = {
        'female-American': ['Aoede', 'Leda', 'Kore', 'Zephyr', 'Lyra'],
        'female-British':  ['Callirrhoe', 'Autonoe', 'Schedar', 'Leda', 'Kore'],
        'male-American':   ['Charon', 'Fenrir', 'Orus', 'Perseus', 'Puck'],
        'male-British':    ['Algieba', 'Iapetus', 'Enceladus', 'Umbriel', 'Achernar'],
      };
      const key = `${voiceProfile.gender}-${voiceProfile.accent}`;
      const voices = geminiVoices[key] ?? geminiVoices['female-American'];
      // pick deterministically by voice id
      const idx = ['fa-sophia','fa-emma','fa-olivia','fa-ava','fa-isabella',
                   'ma-james','ma-william','ma-alexander','ma-daniel','ma-benjamin',
                   'fb-charlotte','fb-victoria','fb-elizabeth','fb-margaret','fb-alice',
                   'mb-arthur','mb-oliver','mb-henry','mb-frederick','mb-edward']
                   .indexOf(voiceProfile.id) % 5;
      return { provider: 'gemini', model: 'gemini-2.5-flash-preview-tts', voice: voices[idx] };
    }
    case 'business':
    case 'chorus':
    case 'enterprise':
    case 'hydra': {
      const xaiFemale = ['eve', 'ara', 'eve', 'ara', 'eve'];
      const xaiMale   = ['rex', 'sal', 'leo', 'rex', 'sal'];
      const all = ['fa-sophia','fa-emma','fa-olivia','fa-ava','fa-isabella',
                   'ma-james','ma-william','ma-alexander','ma-daniel','ma-benjamin',
                   'fb-charlotte','fb-victoria','fb-elizabeth','fb-margaret','fb-alice',
                   'mb-arthur','mb-oliver','mb-henry','mb-frederick','mb-edward'];
      const idx = all.indexOf(voiceProfile.id) % 5;
      const voice = voiceProfile.gender === 'female' ? xaiFemale[idx] : xaiMale[idx];
      return { provider: 'xai', voice };
    }
    default:
      // Free / admin — AWS Polly standard, no engine param needed
      return { voice: voiceProfile.puterVoice };
  }
}

export async function playVoicePreview(voiceId: string): Promise<void> {
  stopVoicePreview();

  const voiceProfile = getVoiceById(voiceId);
  if (!voiceProfile) {
    console.warn(`Voice profile not found: ${voiceId}`);
    return;
  }

  // Voice previews always use the browser's built-in speech synthesis.
  // This costs no Puter credits and works instantly.
  // Chrome/Safari/Edge provide high-quality Google, Apple, and Microsoft voices.
  try {
    console.log(`[TTS Preview] Browser TTS preview for: ${voiceId}`);
    return await playBrowserTTSPreview(voiceProfile);
  } catch (error) {
    currentPreviewVoiceId = null;
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
  if (currentSpeechUtterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentSpeechUtterance = null;
  }
  currentPreviewVoiceId = null;
}

export function isVoicePreviewPlaying(voiceId: string): boolean {
  if (currentPreviewVoiceId !== voiceId) return false;
  if (currentPreviewAudio) return !currentPreviewAudio.paused;
  if (currentSpeechUtterance) return typeof window !== 'undefined' && window.speechSynthesis.speaking;
  return false;
}

export function isBrowserTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
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
      const srcData =
        ch < buf.numberOfChannels ? buf.getChannelData(ch) : new Float32Array(buf.length);
      merged.getChannelData(ch).set(srcData, offset);
    }
    offset += buf.length;
  }

  return merged;
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

  const plan = isAdmin ? 'free' : (user?.plan ?? 'free');
  const charLimit = isAdmin ? Infinity : (planLimits[plan] ?? (isAuthenticated ? 10000 : 5000));

  if (text.trim().length > charLimit) {
    const limitLabel = charLimit === Infinity ? 'unlimited' : charLimit.toLocaleString();
    throw new Error(
      `Text exceeds your ${plan} plan limit of ${limitLabel} characters (${text.trim().length.toLocaleString()} characters).`
    );
  }

  await ensurePuterAuth();
  const puter = getPuter();
  const ttsOptions = getPuterOptions(plan, voiceProfile);
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
