interface PuterTTSOptions {
  engine?: 'standard' | 'neural' | 'generative';
  provider?: 'aws' | 'openai' | 'elevenlabs' | 'gemini' | 'xai';
  model?: string;
  voice?: string;
  instructions?: string;
  language?: string;
}

interface PuterAuth {
  isSignedIn(): boolean;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

interface PuterAI {
  txt2speech(text: string, options?: PuterTTSOptions): Promise<HTMLAudioElement>;
}

interface Puter {
  auth: PuterAuth;
  ai: PuterAI;
}

declare global {
  interface Window {
    puter: Puter;
  }
}

export {};
export type { PuterTTSOptions };
