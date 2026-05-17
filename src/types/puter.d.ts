interface PuterTTSOptions {
  voice?: string;
  language?: string;
}

interface PuterAI {
  txt2speech(text: string, options?: PuterTTSOptions): Promise<HTMLAudioElement>;
}

interface PuterInstance {
  ai: PuterAI;
}

declare global {
  const puter: PuterInstance;
}

export {};
