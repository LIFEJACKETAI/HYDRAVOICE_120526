interface PuterTTSOptions {
<<<<<<< HEAD
  voice?: string;
=======
  engine?: 'standard' | 'neural' | 'generative';
  provider?: 'aws' | 'openai' | 'elevenlabs' | 'gemini' | 'xai';
  model?: string;
  voice?: string;
  instructions?: string;
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
  language?: string;
}

interface PuterAI {
  txt2speech(text: string, options?: PuterTTSOptions): Promise<HTMLAudioElement>;
}

<<<<<<< HEAD
interface PuterInstance {
=======
interface Puter {
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
  ai: PuterAI;
}

declare global {
<<<<<<< HEAD
  const puter: PuterInstance;
=======
  interface Window {
    puter: Puter;
  }
>>>>>>> 16366b71076b9a4d8291f4081b37067fff782842
}

export {};
export type { PuterTTSOptions };
