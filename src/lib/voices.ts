/**
 * Voice profiles for Hydravoice TTS engine.
 *
 * 20 curated voices powered by Puter.js client-side TTS (OpenAI TTS via Puter).
 *
 * Available Puter/OpenAI TTS voices:
 *   - alloy   — neutral, clear, versatile
 *   - echo    — male, natural, conversational
 *   - fable   — expressive, warm, narrative style
 *   - onyx    — deep, authoritative, male
 *   - nova    — warm, natural, female
 *   - shimmer — gentle, soft, female
 *
 * Categories:
 * - 5 Female American  (nova / shimmer / alloy)
 * - 5 Male American    (onyx / echo)
 * - 5 Female British   (fable / shimmer / nova)
 * - 5 Male British     (fable / onyx / echo)
 */

export interface BrowserVoiceHint {
  /** Language code for browser SpeechSynthesis */
  lang: string;
  /** Preferred voice name substrings to match in browser voice list */
  voiceHints: string[];
  /** Pitch adjustment: 0.1 to 2, default 1 */
  pitch: number;
  /** Rate adjustment: 0.1 to 10, default 1 */
  rate: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  accent: 'American' | 'British';
  gender: 'female' | 'male';
  /** Browser voice for previews */
  browserVoice: BrowserVoiceHint;
  /** Legacy Z.AI SDK voice name — kept for backward compat */
  sdkVoice: 'jam' | 'kazi';
  /** OpenAI TTS voice name used by Puter.js: alloy | echo | fable | onyx | nova | shimmer */
  puterVoice: string;
  /** TTS speed for backend generation (0.9 - 1.25) */
  ttsSpeed: number;
  /** Pitch shift factor — kept for backward compat, unused in Puter path */
  pitchShift: number;
  description: string;
  previewText: string;
}

// ── Voice Definitions ──────────────────────────────────────────────

export const VOICE_PROFILES: VoiceProfile[] = [
  // ── Female American ─────────────────────────────────────────────
  // Use kazi (clear English) with subtle pitch shifts for adult female warmth
  {
    id: 'fa-sophia',
    name: 'Sophia',
    accent: 'American',
    gender: 'female',
    browserVoice: { lang: 'en-US', voiceHints: ['Samantha', 'Zira', 'Google US English', 'female'], pitch: 1.1, rate: 0.95 },
    sdkVoice: 'kazi',
    puterVoice: 'nova',
    ttsSpeed: 1.0,
    pitchShift: 1.08,
    description: 'Warm and friendly, perfect for storytelling and narrative content',
    previewText: "Hello, I'm Sophia. I'd love to read your stories aloud with warmth and care.",
  },
  {
    id: 'fa-emma',
    name: 'Emma',
    accent: 'American',
    gender: 'female',
    browserVoice: { lang: 'en-US', voiceHints: ['Google US English', 'Samantha', 'Karen', 'female'], pitch: 1.0, rate: 1.0 },
    sdkVoice: 'kazi',
    puterVoice: 'shimmer',
    ttsSpeed: 1.05,
    pitchShift: 1.05,
    description: 'Clear and professional, ideal for business and educational material',
    previewText: "Hi there, I'm Emma. Let me bring clarity and professionalism to your documents.",
  },
  {
    id: 'fa-olivia',
    name: 'Olivia',
    accent: 'American',
    gender: 'female',
    browserVoice: { lang: 'en-US', voiceHints: ['Zira', 'Samantha', 'Google US English', 'female'], pitch: 1.15, rate: 0.9 },
    sdkVoice: 'kazi',
    puterVoice: 'shimmer',
    ttsSpeed: 0.95,
    pitchShift: 1.10,
    description: 'Gentle and soothing, great for relaxation and meditation texts',
    previewText: "Hello, I'm Olivia. I'll read your content with a gentle, soothing tone.",
  },
  {
    id: 'fa-ava',
    name: 'Ava',
    accent: 'American',
    gender: 'female',
    browserVoice: { lang: 'en-US', voiceHints: ['Google US English', 'Samantha', 'female'], pitch: 1.2, rate: 1.05 },
    sdkVoice: 'kazi',
    puterVoice: 'nova',
    ttsSpeed: 1.15,
    pitchShift: 1.0,
    description: 'Energetic and engaging, best for fiction and dramatic readings',
    previewText: "Hey! I'm Ava, and I bring energy and excitement to every word I read!",
  },
  {
    id: 'fa-isabella',
    name: 'Isabella',
    accent: 'American',
    gender: 'female',
    browserVoice: { lang: 'en-US', voiceHints: ['Samantha', 'Google US English', 'Karen', 'female'], pitch: 0.95, rate: 0.85 },
    sdkVoice: 'kazi',
    puterVoice: 'alloy',
    ttsSpeed: 0.92,
    pitchShift: 1.12,
    description: 'Articulate and measured, excellent for academic and technical content',
    previewText: "Greetings, I'm Isabella. I specialize in articulate delivery of complex content.",
  },

  // ── Male American ───────────────────────────────────────────────
  // Use kazi with moderate pitch shifts for male depth
  {
    id: 'ma-james',
    name: 'James',
    accent: 'American',
    gender: 'male',
    browserVoice: { lang: 'en-US', voiceHints: ['Daniel', 'Alex', 'Google US English', 'male'], pitch: 0.85, rate: 0.9 },
    sdkVoice: 'kazi',
    puterVoice: 'onyx',
    ttsSpeed: 0.95,
    pitchShift: 1.18,
    description: 'Deep and authoritative, ideal for non-fiction and documentaries',
    previewText: "Hello, I'm James. I bring depth and authority to every narration.",
  },
  {
    id: 'ma-william',
    name: 'William',
    accent: 'American',
    gender: 'male',
    browserVoice: { lang: 'en-US', voiceHints: ['Alex', 'Daniel', 'Google US English', 'male'], pitch: 1.0, rate: 1.0 },
    sdkVoice: 'kazi',
    puterVoice: 'echo',
    ttsSpeed: 1.0,
    pitchShift: 1.15,
    description: 'Smooth and conversational, perfect for casual and narrative content',
    previewText: "Hey there, I'm William. Let me read your content in a smooth, conversational style.",
  },
  {
    id: 'ma-alexander',
    name: 'Alexander',
    accent: 'American',
    gender: 'male',
    browserVoice: { lang: 'en-US', voiceHints: ['Daniel', 'Alex', 'Google US English', 'male'], pitch: 0.75, rate: 0.85 },
    sdkVoice: 'kazi',
    puterVoice: 'onyx',
    ttsSpeed: 0.92,
    pitchShift: 1.20,
    description: 'Rich and resonant, great for epic and adventure stories',
    previewText: "Greetings, I'm Alexander. My rich voice is perfect for epic tales and adventures.",
  },
  {
    id: 'ma-daniel',
    name: 'Daniel',
    accent: 'American',
    gender: 'male',
    browserVoice: { lang: 'en-US', voiceHints: ['Google US English', 'Alex', 'Daniel', 'male'], pitch: 0.9, rate: 0.95 },
    sdkVoice: 'kazi',
    puterVoice: 'echo',
    ttsSpeed: 0.98,
    pitchShift: 1.12,
    description: 'Calm and steady, excellent for educational and instructional material',
    previewText: "Hello, I'm Daniel. I deliver calm and steady narration for any content.",
  },
  {
    id: 'ma-benjamin',
    name: 'Benjamin',
    accent: 'American',
    gender: 'male',
    browserVoice: { lang: 'en-US', voiceHints: ['Alex', 'Daniel', 'Google US English', 'male'], pitch: 1.0, rate: 1.05 },
    sdkVoice: 'kazi',
    puterVoice: 'fable',
    ttsSpeed: 1.1,
    pitchShift: 1.08,
    description: 'Warm and inviting, best for light fiction and casual content',
    previewText: "Hi, I'm Benjamin. I bring warmth and friendliness to everything I read.",
  },

  // ── Female British ──────────────────────────────────────────────
  // Use jam (British accent) with subtle pitch shifts for female warmth
  {
    id: 'fb-charlotte',
    name: 'Charlotte',
    accent: 'British',
    gender: 'female',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Female', 'Kate', 'female'], pitch: 1.05, rate: 0.9 },
    sdkVoice: 'jam',
    puterVoice: 'fable',
    ttsSpeed: 1.0,
    pitchShift: 1.08,
    description: 'Elegant and refined, perfect for classic literature and period pieces',
    previewText: "Good day, I'm Charlotte. I specialise in elegant readings of classic literature.",
  },
  {
    id: 'fb-victoria',
    name: 'Victoria',
    accent: 'British',
    gender: 'female',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Female', 'Kate', 'female'], pitch: 1.0, rate: 0.95 },
    sdkVoice: 'jam',
    puterVoice: 'shimmer',
    ttsSpeed: 1.05,
    pitchShift: 1.05,
    description: 'Polished and articulate, ideal for professional and formal content',
    previewText: "Hello, I'm Victoria. I deliver polished and articulate narrations.",
  },
  {
    id: 'fb-elizabeth',
    name: 'Elizabeth',
    accent: 'British',
    gender: 'female',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Female', 'Kate', 'female'], pitch: 1.15, rate: 0.85 },
    sdkVoice: 'jam',
    puterVoice: 'nova',
    ttsSpeed: 0.95,
    pitchShift: 1.10,
    description: 'Graceful and melodic, great for poetry and literary fiction',
    previewText: "Greetings, I'm Elizabeth. I bring grace and melody to literary works.",
  },
  {
    id: 'fb-margaret',
    name: 'Margaret',
    accent: 'British',
    gender: 'female',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Female', 'Kate', 'female'], pitch: 0.9, rate: 0.85 },
    sdkVoice: 'jam',
    puterVoice: 'alloy',
    ttsSpeed: 0.92,
    pitchShift: 1.12,
    description: 'Distinguished and authoritative, best for historical and biographical works',
    previewText: "Hello, I'm Margaret. I specialise in distinguished readings of historical works.",
  },
  {
    id: 'fb-alice',
    name: 'Alice',
    accent: 'British',
    gender: 'female',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Female', 'Kate', 'female'], pitch: 1.1, rate: 1.0 },
    sdkVoice: 'jam',
    puterVoice: 'nova',
    ttsSpeed: 1.15,
    pitchShift: 1.0,
    description: 'Bright and engaging, excellent for contemporary fiction and audiobooks',
    previewText: "Hi there, I'm Alice. I bring a bright and engaging style to contemporary fiction.",
  },

  // ── Male British ────────────────────────────────────────────────
  // Use jam (British gentleman) with moderate pitch shifts for male depth
  {
    id: 'mb-arthur',
    name: 'Arthur',
    accent: 'British',
    gender: 'male',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Male', 'Daniel', 'male'], pitch: 0.85, rate: 0.9 },
    sdkVoice: 'jam',
    puterVoice: 'fable',
    ttsSpeed: 0.95,
    pitchShift: 1.18,
    description: 'Distinguished and classic, perfect for mystery and detective novels',
    previewText: "Good evening, I'm Arthur. I excel at bringing mysteries and detective stories to life.",
  },
  {
    id: 'mb-oliver',
    name: 'Oliver',
    accent: 'British',
    gender: 'male',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Male', 'Daniel', 'male'], pitch: 0.95, rate: 0.85 },
    sdkVoice: 'jam',
    puterVoice: 'onyx',
    ttsSpeed: 0.92,
    pitchShift: 1.20,
    description: 'Sophisticated and measured, ideal for academic and philosophical works',
    previewText: "Hello, I'm Oliver. I offer sophisticated narration for academic and philosophical works.",
  },
  {
    id: 'mb-henry',
    name: 'Henry',
    accent: 'British',
    gender: 'male',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Male', 'Daniel', 'male'], pitch: 0.9, rate: 0.95 },
    sdkVoice: 'jam',
    puterVoice: 'fable',
    ttsSpeed: 1.0,
    pitchShift: 1.15,
    description: 'Warm and characterful, great for fantasy and adventure storytelling',
    previewText: "Greetings, I'm Henry. My warm voice brings fantasy worlds to vivid life.",
  },
  {
    id: 'mb-frederick',
    name: 'Frederick',
    accent: 'British',
    gender: 'male',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Male', 'Daniel', 'male'], pitch: 0.75, rate: 0.9 },
    sdkVoice: 'jam',
    puterVoice: 'onyx',
    ttsSpeed: 0.9,
    pitchShift: 1.20,
    description: 'Commanding and dramatic, best for thrillers and suspense',
    previewText: "I'm Frederick. My commanding voice is perfect for thrillers and suspense.",
  },
  {
    id: 'mb-edward',
    name: 'Edward',
    accent: 'British',
    gender: 'male',
    browserVoice: { lang: 'en-GB', voiceHints: ['Google UK English Male', 'Daniel', 'male'], pitch: 1.0, rate: 0.9 },
    sdkVoice: 'jam',
    puterVoice: 'echo',
    ttsSpeed: 0.98,
    pitchShift: 1.10,
    description: 'Gentle and thoughtful, excellent for memoirs and reflective content',
    previewText: "Hello, I'm Edward. I bring gentle thoughtfulness to memoirs and reflective writing.",
  },
];

/** English-only SDK voices for TTS conversion */
export const SDK_VOICES = ['jam', 'kazi'] as const;

export type SdkVoice = (typeof SDK_VOICES)[number];

/** Get a voice profile by its ID */
export function getVoiceById(id: string): VoiceProfile | undefined {
  return VOICE_PROFILES.find((v) => v.id === id);
}

/** Validate that a voice choice ID exists in our profiles */
export function isValidVoiceChoice(id: string): boolean {
  return VOICE_PROFILES.some((v) => v.id === id);
}

/** Get all voices filtered by criteria */
export function getVoices(filter?: {
  accent?: 'American' | 'British';
  gender?: 'female' | 'male';
}): VoiceProfile[] {
  if (!filter) return VOICE_PROFILES;
  return VOICE_PROFILES.filter(
    (v) =>
      (!filter.accent || v.accent === filter.accent) &&
      (!filter.gender || v.gender === filter.gender)
  );
}

/**
 * Split text into chunks at sentence boundaries for TTS processing.
 * We chunk at ~1000 chars to stay under the SDK's 1024 character limit.
 */
export function splitTextIntoChunks(text: string, maxLength: number = 1000): string[] {
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
